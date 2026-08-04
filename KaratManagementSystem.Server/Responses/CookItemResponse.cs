using KaratManagementSystem.Server.Models;

namespace KaratManagementSystem.Server.Responses
{
    public class CookItemResponse : BaseResponse
    {
        public CookItemResponse() { }
        public CookItemResponse(string message) : base(message) { }
        public CookItemResponse(CookItem cookItem)
        {
            CookItem = cookItem;
        }

        public CookItem? CookItem { get; set; } = new();
    }
}
