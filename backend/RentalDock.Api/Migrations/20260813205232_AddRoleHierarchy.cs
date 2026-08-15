using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RentalDock.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserType",
                table: "Users",
                type: "character varying(21)",
                maxLength: 21,
                nullable: false,
                defaultValue: "");

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AccessFailedCount", "ConcurrencyStamp", "CreatedAt", "Email", "EmailConfirmed", "FirstName", "IsActive", "LastName", "LockoutEnabled", "LockoutEnd", "NormalizedEmail", "NormalizedUserName", "PasswordHash", "PhoneNumber", "PhoneNumberConfirmed", "ProfileImageUrl", "SecurityStamp", "TwoFactorEnabled", "UpdatedAt", "UserName", "UserType" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000001"), 0, "f20a53f4-107a-4fc0-8797-6fbd285a9309", new DateTime(2026, 8, 13, 20, 52, 31, 497, DateTimeKind.Utc).AddTicks(2630), "admin@rentaldock.com", true, "Admin", true, "User", false, null, "ADMIN@RENTALDOCK.COM", "ADMIN", "AQAAAAIAAYagAAAAEF1234567890abcdefghijklmnopqrst", null, false, null, null, false, new DateTime(2026, 8, 13, 20, 52, 31, 497, DateTimeKind.Utc).AddTicks(2630), "admin", "AdminUser" },
                    { new Guid("00000000-0000-0000-0000-000000000002"), 0, "f7cef97c-095b-44b0-9b24-a55a2ca66179", new DateTime(2026, 8, 13, 20, 52, 31, 497, DateTimeKind.Utc).AddTicks(2640), "owner@rentaldock.com", true, "John", true, "Owner", false, null, "OWNER@RENTALDOCK.COM", "OWNER", "AQAAAAIAAYagAAAAEF1234567890abcdefghijklmnopqrst", null, false, null, null, false, new DateTime(2026, 8, 13, 20, 52, 31, 497, DateTimeKind.Utc).AddTicks(2640), "owner", "OwnerUser" },
                    { new Guid("00000000-0000-0000-0000-000000000003"), 0, "5874f2fe-5543-4b5a-87d1-f94b540cd031", new DateTime(2026, 8, 13, 20, 52, 31, 497, DateTimeKind.Utc).AddTicks(2650), "renter@rentaldock.com", true, "Jane", true, "Renter", false, null, "RENTER@RENTALDOCK.COM", "RENTER", "AQAAAAIAAYagAAAAEF1234567890abcdefghijklmnopqrst", null, false, null, null, false, new DateTime(2026, 8, 13, 20, 52, 31, 497, DateTimeKind.Utc).AddTicks(2650), "renter", "RenterUser" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000003"));

            migrationBuilder.DropColumn(
                name: "UserType",
                table: "Users");
        }
    }
}
