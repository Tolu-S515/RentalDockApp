namespace RentalDock.Api.Entities;

// One row per owner per weekday: the window when renters can pick up and drop off.
public class BusinessHours
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OwnerId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public bool IsClosed { get; set; }
    public TimeOnly OpenTime { get; set; }
    public TimeOnly CloseTime { get; set; }

    public OwnerUser Owner { get; set; } = null!;
}
