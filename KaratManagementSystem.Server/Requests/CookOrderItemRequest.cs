namespace KaratManagementSystem.Server.Requests
{
    public class CookOrderItemRequest
    {
        public int CookItemId { get; set; }
        public int Quantity { get; set; } = 1;
    }
}
