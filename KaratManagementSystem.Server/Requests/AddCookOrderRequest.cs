namespace KaratManagementSystem.Server.Requests
{
    public class AddCookOrderRequest
    {
        public int TableId { get; set; }
        public List<CookOrderItemRequest> CookItems { get; set; } = [];
    }
}
