using KaratManagementSystem.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;

namespace KaratManagementSystem.Server
{
    public class DbApp : DbContext
    {
        public DbApp(DbContextOptions<DbApp> options) : base(options)
        {
            Database.EnsureCreated();
        }

        public DbSet<ServingTable> ServingTables { get; set; }
        public DbSet<CookItem> CookItems { get; set; }
        public DbSet<CookOrder> CookOrders { get; set; }
        public DbSet<CookOrderItem> CookOrderItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<CookOrder>()
                .HasMany(order => order.CookItems)
                .WithMany(item => item.CookOrders)
                .UsingEntity<CookOrderItem>(
                    join => join.HasOne(oi => oi.CookItem)
                        .WithMany()
                        .HasForeignKey(oi => oi.CookItemId),
                    join => join.HasOne(oi => oi.CookOrder)
                        .WithMany(o => o.CookOrderItems)
                        .HasForeignKey(oi => oi.CookOrderId));

            modelBuilder.Entity<ServingTable>().HasData(
                new
                {
                    Id = 1,
                    Name = "1"
                },
                new
                {
                    Id = 2,
                    Name = "2"
                });

            modelBuilder.Entity<CookItem>().HasData(
                new
                {
                    Id = 1,
                    Name = "Нагетси"
                },
                new
                {
                    Id = 2,
                    Name = "Піца"
                },
                new
                {
                    Id = 3,
                    Name = "Нарізка"
                });

            modelBuilder.Entity<CookOrder>().HasData(
                new
                {
                    Id = 1,
                    TableId = 1,
                    Notes = "Терміново",
                    IsProcessing = false,
                    IsCompleted = false,
                    CreatedAt = new DateTime(2026, 7, 31, 12, 0, 0)
                },
                new
                {
                    Id = 2,
                    TableId = 2,
                    Notes = "Без соусу",
                    IsProcessing = true,
                    IsCompleted = false,
                    CreatedAt = new DateTime(2026, 7, 31, 12, 30, 0)
                });

            modelBuilder.Entity<CookOrderItem>().HasData(
                new
                {
                    Id = 1,
                    CookOrderId = 1,
                    CookItemId = 1,
                    Quantity = 2,
                    IsReady = false
                },
                new
                {
                    Id = 2,
                    CookOrderId = 1,
                    CookItemId = 2,
                    Quantity = 1,
                    IsReady = false
                },
                new
                {
                    Id = 3,
                    CookOrderId = 2,
                    CookItemId = 3,
                    Quantity = 1,
                    IsReady = false
                });
        }
    }
}
