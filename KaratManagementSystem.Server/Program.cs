using System.Text;
using KaratManagementSystem.Server;
using KaratManagementSystem.Server.Models;
using KaratManagementSystem.Server.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("AuthSecrets.local.json", optional: false, reloadOnChange: true);
var configuration = builder.Configuration;

var authSettings = configuration.GetSection(AuthSettings.SectionName).Get<AuthSettings>()
    ?? throw new InvalidOperationException("Auth settings are not configured.");
ValidateAuthSettings(authSettings);

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authSettings.Jwt.SigningKey));

builder.Services.Configure<AuthSettings>(configuration.GetSection(AuthSettings.SectionName));
#if SQLITE
builder.Services.AddDbContext<DbApp>(options =>
        options.UseSqlite(configuration.GetConnectionString("SqliteConnection")));
#else
builder.Services.AddDbContext<DbApp>(options =>
        options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));
#endif
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = true;
        options.SaveToken = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateIssuer = true,
            ValidIssuer = authSettings.Jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = authSettings.Jwt.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

ApplyMigrations(app);

await SeedAdminAccountAsync(app, authSettings.Admin.Password);

app.UseDefaultFiles();
app.MapStaticAssets();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("/index.html");

app.Run();

static void ValidateAuthSettings(AuthSettings settings)
{
    if (string.IsNullOrWhiteSpace(settings.Jwt.Issuer) ||
        string.IsNullOrWhiteSpace(settings.Jwt.Audience) ||
        string.IsNullOrWhiteSpace(settings.Jwt.SigningKey))
    {
        throw new InvalidOperationException("JWT settings are incomplete.");
    }

    if (Encoding.UTF8.GetByteCount(settings.Jwt.SigningKey) < 32)
    {
        throw new InvalidOperationException("JWT signing key must be at least 32 bytes.");
    }

    if (settings.Jwt.AccessTokenLifetimeMinutes <= 0)
    {
        throw new InvalidOperationException("JWT access token lifetime must be positive.");
    }

    if (string.IsNullOrWhiteSpace(settings.Admin.Password))
    {
        throw new InvalidOperationException("Admin password must be configured.");
    }
}

static async Task SeedAdminAccountAsync(WebApplication app, string adminPassword)
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<DbApp>();

    var admin = await dbContext.AppUsers.SingleOrDefaultAsync(user => user.Login == "admin");
    var passwordHasher = new PasswordHasher<AppUser>();

    if (admin == null)
    {
        admin = new AppUser
        {
            Login = "admin",
            Role = "Admin",
            IsActive = true
        };
        admin.PasswordHash = passwordHasher.HashPassword(admin, adminPassword);
        dbContext.AppUsers.Add(admin);
    }
    else
    {
        admin.Role = "Admin";
        admin.IsActive = true;

        var verificationResult = passwordHasher.VerifyHashedPassword(admin, admin.PasswordHash, adminPassword);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            admin.PasswordHash = passwordHasher.HashPassword(admin, adminPassword);
        }
    }

    await dbContext.SaveChangesAsync();
}

static void ApplyMigrations(WebApplication app)
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<DbApp>();

        // Check and apply pending migrations
        var pendingMigrations = dbContext.Database.GetPendingMigrations();
        if (pendingMigrations.Any())
        {
            Console.WriteLine("Applying pending migrations...");
            dbContext.Database.Migrate();
            Console.WriteLine("Migrations applied successfully.");
        }
        else
        {
            Console.WriteLine("No pending migrations found.");
        }
    }
}