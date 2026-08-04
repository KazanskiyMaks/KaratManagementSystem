using KaratManagementSystem.Server.Models;

namespace KaratManagementSystem.Server.Requests
{
    public class ChangeCookOrderRequest
    {
        public int CookOrderId { get; set; }
        public ServingTable ServingTable { get; set; } = new();
        public List<CookOrderItemRequest> CookItems { get; set; } = [];
    }
}
