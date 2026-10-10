namespace KaratManagementSystem.Server.Settings
{
    public class AuthSettings
    {
        public const string SectionName = "Auth";
        public JwtSettings Jwt { get; set; } = new();
        public AdminSettings Admin { get; set; } = new();
    }

    public class JwtSettings
    {
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public string SigningKey { get; set; } = string.Empty;
        public int AccessTokenLifetimeMinutes { get; set; } = 60;
    }

    public class AdminSettings
    {
        public string Password { get; set; } = string.Empty;
    }
}
