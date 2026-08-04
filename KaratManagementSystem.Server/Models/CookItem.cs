using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace KaratManagementSystem.Server.Models
{
    public class CookItem
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
        [JsonIgnore]
        public List<CookOrder> CookOrders { get; set; } = [];
    }
}
