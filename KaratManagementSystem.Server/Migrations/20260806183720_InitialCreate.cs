using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace KaratManagementSystem.Server.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Login = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CookItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CookItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ServingTables",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServingTables", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CookOrders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TableId = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false),
                    IsProcessing = table.Column<bool>(type: "boolean", nullable: false),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CookOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CookOrders_ServingTables_TableId",
                        column: x => x.TableId,
                        principalTable: "ServingTables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CookOrderItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CookOrderId = table.Column<int>(type: "integer", nullable: false),
                    CookItemId = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    IsReady = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CookOrderItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CookOrderItems_CookItems_CookItemId",
                        column: x => x.CookItemId,
                        principalTable: "CookItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CookOrderItems_CookOrders_CookOrderId",
                        column: x => x.CookOrderId,
                        principalTable: "CookOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_Login",
                table: "AppUsers",
                column: "Login",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CookOrderItems_CookItemId",
                table: "CookOrderItems",
                column: "CookItemId");

            migrationBuilder.CreateIndex(
                name: "IX_CookOrderItems_CookOrderId",
                table: "CookOrderItems",
                column: "CookOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_CookOrders_TableId",
                table: "CookOrders",
                column: "TableId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppUsers");

            migrationBuilder.DropTable(
                name: "CookOrderItems");

            migrationBuilder.DropTable(
                name: "CookItems");

            migrationBuilder.DropTable(
                name: "CookOrders");

            migrationBuilder.DropTable(
                name: "ServingTables");
        }
    }
}
