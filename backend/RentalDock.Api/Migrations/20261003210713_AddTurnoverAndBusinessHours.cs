using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalDock.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTurnoverAndBusinessHours : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_ProductId",
                table: "Bookings");

            migrationBuilder.AddColumn<int>(
                name: "TurnoverMinutes",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "BlockedUntil",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            // Existing bookings had no turnover, so they're blocked only until they end.
            migrationBuilder.Sql("UPDATE \"Bookings\" SET \"BlockedUntil\" = \"EndDateTime\";");

            migrationBuilder.CreateTable(
                name: "BusinessHours",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayOfWeek = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    IsClosed = table.Column<bool>(type: "boolean", nullable: false),
                    OpenTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    CloseTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessHours", x => x.Id);
                    table.CheckConstraint("CK_BusinessHours_TimeRange", "\"IsClosed\" OR \"CloseTime\" > \"OpenTime\"");
                    table.ForeignKey(
                        name: "FK_BusinessHours_Users_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "UpdatedAt" },
                values: new object[] { "ba29a1d4-4fa3-46e9-a0be-a1381d8ed410", new DateTime(2026, 10, 3, 21, 7, 12, 483, DateTimeKind.Utc).AddTicks(7160), new DateTime(2026, 10, 3, 21, 7, 12, 483, DateTimeKind.Utc).AddTicks(7160) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000002"),
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "UpdatedAt" },
                values: new object[] { "7b203793-952e-4838-99d7-2b53fcde74c6", new DateTime(2026, 10, 3, 21, 7, 12, 483, DateTimeKind.Utc).AddTicks(7180), new DateTime(2026, 10, 3, 21, 7, 12, 483, DateTimeKind.Utc).AddTicks(7180) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000003"),
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "UpdatedAt" },
                values: new object[] { "c8da5c82-bad8-4184-a858-9b51732737a4", new DateTime(2026, 10, 3, 21, 7, 12, 483, DateTimeKind.Utc).AddTicks(7190), new DateTime(2026, 10, 3, 21, 7, 12, 483, DateTimeKind.Utc).AddTicks(7190) });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Products_TurnoverMinutes",
                table: "Products",
                sql: "\"TurnoverMinutes\" >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_ProductId_StartDateTime_BlockedUntil",
                table: "Bookings",
                columns: new[] { "ProductId", "StartDateTime", "BlockedUntil" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Bookings_BlockedUntil",
                table: "Bookings",
                sql: "\"BlockedUntil\" >= \"EndDateTime\"");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessHours_OwnerId_DayOfWeek",
                table: "BusinessHours",
                columns: new[] { "OwnerId", "DayOfWeek" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusinessHours");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Products_TurnoverMinutes",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_ProductId_StartDateTime_BlockedUntil",
                table: "Bookings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Bookings_BlockedUntil",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "TurnoverMinutes",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "BlockedUntil",
                table: "Bookings");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "UpdatedAt" },
                values: new object[] { "f20a53f4-107a-4fc0-8797-6fbd285a9309", new DateTime(2026, 8, 13, 20, 52, 31, 497, DateTimeKind.Utc).AddTicks(2630), new DateTime(2026, 8, 13, 20, 52, 31, 497, DateTimeKind.Utc).AddTicks(2630) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000002"),
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "UpdatedAt" },
                values: new object[] { "f7cef97c-095b-44b0-9b24-a55a2ca66179", new DateTime(2026, 8, 13, 20, 52, 31, 497, DateTimeKind.Utc).AddTicks(2640), new DateTime(2026, 8, 13, 20, 52, 31, 497, DateTimeKind.Utc).AddTicks(2640) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000003"),
                columns: new[] { "ConcurrencyStamp", "CreatedAt", "UpdatedAt" },
                values: new object[] { "5874f2fe-5543-4b5a-87d1-f94b540cd031", new DateTime(2026, 8, 13, 20, 52, 31, 497, DateTimeKind.Utc).AddTicks(2650), new DateTime(2026, 8, 13, 20, 52, 31, 497, DateTimeKind.Utc).AddTicks(2650) });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_ProductId",
                table: "Bookings",
                column: "ProductId");
        }
    }
}
