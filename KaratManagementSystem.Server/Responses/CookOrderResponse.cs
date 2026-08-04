using KaratManagementSystem.Server.Models;

namespace KaratManagementSystem.Server.Responses
{
    public class CookOrderResponse : BaseResponse
    {
        public CookOrderResponse() { }
        public CookOrderResponse(string message) : base(message) { }
        public CookOrderResponse(CookOrder cookOrder)
        {
            CookOrder = cookOrder;
        }

        public CookOrder CookOrder { get; set; } = new();
    }
}
