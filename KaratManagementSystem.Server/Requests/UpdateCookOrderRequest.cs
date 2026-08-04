namespace KaratManagementSystem.Server.Requests
{
    public class UpdateCookOrderRequest
    {
        public int? TableId { get; set; }
        public string Notes { get; set; }
        public bool IsProcessing { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}