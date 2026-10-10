namespace KaratManagementSystem.Server.Responses
{
    public class AuthStatusResponse : BaseResponse
    {
        public AuthStatusResponse() { }
        public AuthStatusResponse(string message) : base(message) { }

        public bool IsAuthenticated { get; set; }
        public string? Login { get; set; }
        public string? Role { get; set; } = null;
    }
}
