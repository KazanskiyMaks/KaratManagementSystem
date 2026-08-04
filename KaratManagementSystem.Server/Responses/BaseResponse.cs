namespace KaratManagementSystem.Server.Responses
{
    public class BaseResponse
    {
        public BaseResponse() { }
        public BaseResponse(string message)
        {
            IsSuccess = false;
            Message = message;
        }

        public bool IsSuccess { get; set; } = true;
        public string Message { get; set; } = string.Empty;
    }
}
