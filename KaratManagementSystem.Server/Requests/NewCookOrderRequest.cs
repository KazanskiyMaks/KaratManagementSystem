using KaratManagementSystem.Server.Models;

namespace KaratManagementSystem.Server.Requests
{
    public class NewCookOrderRequest
    {
        public ServingTable ServingTable { get; set; } = new ();
        public List<CookOrderItemRequest> CookItems { get; set; } = [];
        public string Notes { get; set; } = "";
    }
}
