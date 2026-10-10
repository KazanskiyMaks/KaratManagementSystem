using System.ComponentModel.DataAnnotations;

namespace KaratManagementSystem.Server.Models
{
    public class AppUser
    {
        [Key]
        public int Id { get; set; }
        public string Login { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }
}
