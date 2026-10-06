using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalDock.Api.Data;
using RentalDock.Api.DTOs;
using RentalDock.Api.Entities;

namespace RentalDock.Api.Controllers;

[ApiController]
[Route("api/business-hours")]
public class BusinessHoursController(AppDbContext context) : ControllerBase
{
    [HttpGet("owner/{ownerId:guid}")]
    public async Task<IActionResult> GetOwnerHours(Guid ownerId) =>
        Ok(await GetHours(ownerId));

    [Authorize(Roles = "Owner")]
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyHours()
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var ownerId))
            return Unauthorized();

        return Ok(await GetHours(ownerId));
    }

    [Authorize(Roles = "Owner")]
    [HttpPut("mine")]
    public async Task<IActionResult> SetMyHours([FromBody] List<BusinessHoursDto> request)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var ownerId))
            return Unauthorized();

        if (request.Count != 7 || request.Select(day => day.DayOfWeek).Distinct().Count() != 7)
            return BadRequest(new { message = "Provide hours for each day of the week exactly once." });

        var invalidDay = request.FirstOrDefault(day => !day.IsClosed && day.CloseTime <= day.OpenTime);
        if (invalidDay is not null)
            return BadRequest(new { message = $"{invalidDay.DayOfWeek} closing time must be after its opening time." });

        var existing = await context.BusinessHours
            .Where(hours => hours.OwnerId == ownerId)
            .ToListAsync();

        foreach (var day in request)
        {
            var hours = existing.SingleOrDefault(hours => hours.DayOfWeek == day.DayOfWeek);
            if (hours is null)
            {
                hours = new BusinessHours { OwnerId = ownerId, DayOfWeek = day.DayOfWeek };
                context.BusinessHours.Add(hours);
            }

            hours.IsClosed = day.IsClosed;
            hours.OpenTime = day.OpenTime;
            hours.CloseTime = day.CloseTime;
        }

        await context.SaveChangesAsync();

        return Ok(await GetHours(ownerId));
    }

    // Returns an empty list when the owner hasn't set hours yet.
    private async Task<List<BusinessHoursDto>> GetHours(Guid ownerId)
    {
        var hours = await context.BusinessHours
            .AsNoTracking()
            .Where(hours => hours.OwnerId == ownerId)
            .Select(hours => new BusinessHoursDto(
                hours.DayOfWeek,
                hours.IsClosed,
                hours.OpenTime,
                hours.CloseTime))
            .ToListAsync();

        // DayOfWeek is stored as text, so sort in memory to keep Sunday..Saturday order.
        return hours.OrderBy(day => day.DayOfWeek).ToList();
    }
}
