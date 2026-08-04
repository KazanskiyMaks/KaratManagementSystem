using System.ComponentModel.DataAnnotations;

namespace KaratManagementSystem.Server.Models
{
    public class CookOrder
    {
        [Key]
        public int Id { get; set; }
        public ServingTable Table { get; set; }
        public List<CookItem> CookItems { get; set; } = [];
        public List<CookOrderItem> CookOrderItems { get; set; } = [];
        public string Notes { get; set; } = string.Empty;
        public bool IsProcessing { get; set; } = false;
        public bool IsCompleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? StartedAt { get; set; } = null;
        public DateTime? CompletedAt { get; set; } = null;
    }
}
