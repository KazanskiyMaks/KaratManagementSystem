using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace KaratManagementSystem.Server.Models
{
    public class CookOrderItem
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public int CookOrderId { get; set; }
        [Required]
        public int CookItemId { get; set; }
        [Required]
        public int Quantity { get; set; } = 1;
        public bool IsReady { get; set; } = false;
        public CookItem CookItem { get; set; } = null!;
        [JsonIgnore]
        public CookOrder CookOrder { get; set; } = null!;
    }
}
