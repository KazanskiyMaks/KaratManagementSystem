using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using KaratManagementSystem.Server.Models;
using KaratManagementSystem.Server.Requests;
using KaratManagementSystem.Server.Responses;
using KaratManagementSystem.Server.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace KaratManagementSystem.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(DbApp dbApp, IOptions<AuthSettings> authOptions) : ControllerBase
    {
        private readonly DbApp _dbContext = dbApp;
        private readonly AuthSettings _authSettings = authOptions.Value;

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<AuthTokenResponse>> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Login) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new AuthTokenResponse("Login and password are required"));
            }

            var user = await _dbContext.AppUsers.SingleOrDefaultAsync(u => u.Login == request.Login);
            if (user == null || !user.IsActive)
            {
                return Unauthorized(new AuthTokenResponse("Invalid credentials"));
            }

            var passwordHasher = new PasswordHasher<AppUser>();
            var verifyResult = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            if (verifyResult == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new AuthTokenResponse("Invalid credentials"));
            }

            var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_authSettings.Jwt.AccessTokenLifetimeMinutes);
            var token = BuildJwtToken(user, expiresAt);

            return Ok(new AuthTokenResponse
            {
                AccessToken = token,
                ExpiresAt = expiresAt,
                Login = user.Login,
                Role = user.Role
            });
        }

        [AllowAnonymous]
        [HttpGet("status")]
        public async Task<ActionResult<AuthStatusResponse>> Status()
        {
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Ok(new AuthStatusResponse { IsAuthenticated = false });
            }
            var token = authHeader.Substring("Bearer ".Length).Trim();
            var tokenHandler = new JwtSecurityTokenHandler();
            try
            {
                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = _authSettings.Jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = _authSettings.Jwt.Audience,
                    ValidateLifetime = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_authSettings.Jwt.SigningKey)),
                    ValidateIssuerSigningKey = true
                }, out _);
                var loginClaim = principal.FindFirst(ClaimTypes.Name);
                var roleClaim = principal.FindFirst(ClaimTypes.Role);
                if (loginClaim == null || roleClaim == null)
                {
                    return Ok(new AuthStatusResponse { IsAuthenticated = false });
                }
                return Ok(new AuthStatusResponse
                {
                    IsAuthenticated = true,
                    Login = loginClaim.Value,
                    Role = roleClaim.Value
                });
            }
            catch
            {
                return Ok(new AuthStatusResponse { IsAuthenticated = false });
            }
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<AuthTokenResponse>> Refresh()
        {
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized(new AuthTokenResponse("Missing or invalid Authorization header"));
            }
            var token = authHeader.Substring("Bearer ".Length).Trim();
            var tokenHandler = new JwtSecurityTokenHandler();
            try
            {
                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = _authSettings.Jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = _authSettings.Jwt.Audience,
                    ValidateLifetime = false, // Allow expired tokens for refresh
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_authSettings.Jwt.SigningKey)),
                    ValidateIssuerSigningKey = true
                }, out _);
                var loginClaim = principal.FindFirst(ClaimTypes.Name);
                if (loginClaim == null)
                {
                    return Unauthorized(new AuthTokenResponse("Invalid token"));
                }
                var user = await _dbContext.AppUsers.SingleOrDefaultAsync(u => u.Login == loginClaim.Value);
                if (user == null || !user.IsActive)
                {
                    return Unauthorized(new AuthTokenResponse("User not found or inactive"));
                }
                var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_authSettings.Jwt.AccessTokenLifetimeMinutes);
                var newToken = BuildJwtToken(user, expiresAt);
                return Ok(new AuthTokenResponse
                {
                    AccessToken = newToken,
                    ExpiresAt = expiresAt,
                    Login = user.Login,
                    Role = user.Role
                });
            }
            catch
            {
                return Unauthorized(new AuthTokenResponse("Invalid token"));
            }
        }

        private string BuildJwtToken(AppUser user, DateTimeOffset expiresAt)
        {
            var signingCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_authSettings.Jwt.SigningKey)),
                SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Login),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new(ClaimTypes.Name, user.Login),
                new(ClaimTypes.Role, user.Role)
            };

            var jwt = new JwtSecurityToken(
                issuer: _authSettings.Jwt.Issuer,
                audience: _authSettings.Jwt.Audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: expiresAt.UtcDateTime,
                signingCredentials: signingCredentials);

            return new JwtSecurityTokenHandler().WriteToken(jwt);
        }
    }
}
