namespace KaratManagementSystem.Server.Requests
{
    public class UpdateCookOrderRequest
    {
        public int? TableId { get; set; }
        public string Notes { get; set; }
        public bool IsProcessing { get; set; }
        public bool IsCompleted { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset? StartedAt { get; set; }
        public DateTimeOffset? CompletedAt { get; set; }
    }
}