namespace KaratManagementSystem.Server.Responses
{
    public class AuthTokenResponse : BaseResponse
    {
        public AuthTokenResponse() { }
        public AuthTokenResponse(string message) : base(message) { }

        public string AccessToken { get; set; } = string.Empty;
        public DateTimeOffset ExpiresAt { get; set; }
        public string Login { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
