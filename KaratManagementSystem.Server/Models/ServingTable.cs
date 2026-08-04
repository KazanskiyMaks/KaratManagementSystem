using System.ComponentModel.DataAnnotations;

namespace KaratManagementSystem.Server.Models
{
    public class ServingTable
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
    }
}
