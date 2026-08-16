using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalDock.Api.Data;
using RentalDock.Api.DTOs;
using RentalDock.Api.Entities;

namespace RentalDock.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class BookingsController(AppDbContext context) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
    {
        if (!TryGetUserId(out var renterId))
            return Unauthorized();

        if (request.ProductId == Guid.Empty)
            return BadRequest(new { message = "Product is required." });

        var start = request.StartDateTime.UtcDateTime;
        var end = request.EndDateTime.UtcDateTime;

        if (start < DateTime.UtcNow)
            return BadRequest(new { message = "Booking start time cannot be in the past." });

        if (end <= start)
            return BadRequest(new { message = "Booking end time must be after its start time." });

        var renter = await context.Users.AsNoTracking()
            .SingleOrDefaultAsync(user => user.Id == renterId && user.IsActive);

        if (renter is null)
            return Unauthorized();

        var product = await context.Products.AsNoTracking()
            .SingleOrDefaultAsync(product => product.Id == request.ProductId && product.IsActive);

        if (product is null)
            return NotFound(new { message = "Product was not found or is inactive." });

        if (product.OwnerId == renterId)
            return BadRequest(new { message = "You cannot book your own product." });

        var overlaps = await context.Bookings.AnyAsync(booking =>
            booking.ProductId == request.ProductId &&
            booking.Status != BookingStatus.Cancelled &&
            booking.Status != BookingStatus.Rejected &&
            start < booking.EndDateTime &&
            end > booking.StartDateTime);

        if (overlaps)
            return Conflict(new { message = "The product is already booked during that time." });

        var rentalSubtotal = CalculateSubtotal(product, start, end);
        var booking = new Booking
        {
            ProductId = product.Id,
            RenterId = renterId,
            StartDateTime = start,
            EndDateTime = end,
            RentalSubtotal = rentalSubtotal,
            DepositAmount = product.DepositAmount,
            TotalAmount = rentalSubtotal + product.DepositAmount
        };

        context.Bookings.Add(booking);
        await context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetBooking),
            new { id = booking.Id },
            ToResponse(booking, product.Name, product.ImageUrl));
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMyBookings()
    {
        if (!TryGetUserId(out var renterId))
            return Unauthorized();

        var bookings = await context.Bookings
            .AsNoTracking()
            .Where(booking => booking.RenterId == renterId)
            .OrderByDescending(booking => booking.CreatedAt)
            .Select(booking => new BookingResponse(
                booking.Id,
                booking.ProductId,
                booking.Product.Name,
                booking.Product.ImageUrl,
                booking.StartDateTime,
                booking.EndDateTime,
                booking.RentalSubtotal,
                booking.DepositAmount,
                booking.TotalAmount,
                booking.Status,
                booking.CreatedAt))
            .ToListAsync();

        return Ok(bookings);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBooking(Guid id)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var booking = await context.Bookings
            .AsNoTracking()
            .Include(booking => booking.Product)
            .SingleOrDefaultAsync(booking => booking.Id == id);

        if (booking is null)
            return NotFound(new { message = "Booking not found." });

        var canView = booking.RenterId == userId ||
                      booking.Product.OwnerId == userId ||
                      User.IsInRole("Admin");

        if (!canView)
            return Forbid();

        return Ok(ToResponse(booking, booking.Product.Name, booking.Product.ImageUrl));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateBookingStatusRequest request)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var booking = await context.Bookings
            .Include(booking => booking.Product)
            .SingleOrDefaultAsync(booking => booking.Id == id);

        if (booking is null)
            return NotFound(new { message = "Booking not found." });

        if (booking.Status == request.Status)
            return Ok(ToResponse(booking, booking.Product.Name, booking.Product.ImageUrl));

        var isAdmin = User.IsInRole("Admin");
        var isOwner = booking.Product.OwnerId == userId;
        var isRenter = booking.RenterId == userId;

        var renterCanCancel = isRenter &&
                              request.Status == BookingStatus.Cancelled &&
                              booking.Status is BookingStatus.Pending or BookingStatus.Confirmed;

        var ownerCanChange = isOwner && IsOwnerTransitionAllowed(
            booking.Status,
            request.Status);

        if (!isAdmin && !renterCanCancel && !ownerCanChange)
            return Forbid();

        if (!IsValidTransition(booking.Status, request.Status))
        {
            return BadRequest(new
            {
                message = $"A {booking.Status} booking cannot be changed to {request.Status}."
            });
        }

        booking.Status = request.Status;
        booking.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        return Ok(ToResponse(booking, booking.Product.Name, booking.Product.ImageUrl));
    }

    private bool TryGetUserId(out Guid userId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

    private static decimal CalculateSubtotal(Product product, DateTime start, DateTime end)
    {
        var duration = end - start;
        var units = product.PricingPeriod switch
        {
            PricingPeriod.Hour => Math.Ceiling(duration.TotalHours),
            PricingPeriod.Day => Math.Ceiling(duration.TotalDays),
            PricingPeriod.Week => Math.Ceiling(duration.TotalDays / 7),
            PricingPeriod.Month => Math.Ceiling(duration.TotalDays / 30),
            _ => throw new ArgumentOutOfRangeException()
        };

        return product.Price * (decimal)Math.Max(1, units);
    }

    private static bool IsOwnerTransitionAllowed(
        BookingStatus current,
        BookingStatus requested) =>
        (current, requested) switch
        {
            (BookingStatus.Pending, BookingStatus.Confirmed) => true,
            (BookingStatus.Pending, BookingStatus.Rejected) => true,
            (BookingStatus.Pending, BookingStatus.Cancelled) => true,
            (BookingStatus.Confirmed, BookingStatus.Active) => true,
            (BookingStatus.Confirmed, BookingStatus.Cancelled) => true,
            (BookingStatus.Active, BookingStatus.Completed) => true,
            _ => false
        };

    private static bool IsValidTransition(
        BookingStatus current,
        BookingStatus requested) =>
        (current, requested) switch
        {
            (BookingStatus.Pending, BookingStatus.Confirmed) => true,
            (BookingStatus.Pending, BookingStatus.Rejected) => true,
            (BookingStatus.Pending, BookingStatus.Cancelled) => true,
            (BookingStatus.Confirmed, BookingStatus.Active) => true,
            (BookingStatus.Confirmed, BookingStatus.Cancelled) => true,
            (BookingStatus.Active, BookingStatus.Completed) => true,
            _ => false
        };

    private static BookingResponse ToResponse(
        Booking booking,
        string productName,
        string? productImageUrl) =>
        new(
            booking.Id,
            booking.ProductId,
            productName,
            productImageUrl,
            booking.StartDateTime,
            booking.EndDateTime,
            booking.RentalSubtotal,
            booking.DepositAmount,
            booking.TotalAmount,
            booking.Status,
            booking.CreatedAt);
}
