using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using RentalDock.Api.Entities;

namespace RentalDock.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : DbContext(options)
{
    public DbSet<ApplicationUser> Users => Set<ApplicationUser>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<PaymentLog> PaymentLogs => Set<PaymentLog>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.LastName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.ProfileImageUrl).HasMaxLength(2048);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(4000).IsRequired();
            entity.Property(x => x.Location).HasMaxLength(500).IsRequired();
            entity.Property(x => x.ImageUrl).HasMaxLength(2048);
            entity.Property(x => x.Price).HasPrecision(18, 2);
            entity.Property(x => x.DepositAmount).HasPrecision(18, 2);
            entity.Property(x => x.Condition).HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.PricingPeriod).HasConversion<string>().HasMaxLength(20);
            entity.HasOne(x => x.Owner).WithMany(x => x.Products)
                .HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Category).WithMany(x => x.Products)
                .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.Property(x => x.RentalSubtotal).HasPrecision(18, 2);
            entity.Property(x => x.DepositAmount).HasPrecision(18, 2);
            entity.Property(x => x.TotalAmount).HasPrecision(18, 2);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Bookings_DateRange", "\"EndDateTime\" > \"StartDateTime\""));
            entity.HasOne(x => x.Product).WithMany(x => x.Bookings)
                .HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Renter).WithMany(x => x.Bookings)
                .HasForeignKey(x => x.RenterId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PaymentLog>(entity =>
        {
            entity.HasIndex(x => x.TransactionId).IsUnique();
            entity.Property(x => x.TransactionId).HasMaxLength(255);
            entity.Property(x => x.Amount).HasPrecision(18, 2);
            entity.Property(x => x.PaymentType).HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.PaymentStatus).HasConversion<string>().HasMaxLength(30);
            entity.HasOne(x => x.Booking).WithMany(x => x.PaymentLogs)
                .HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasIndex(x => x.BookingId).IsUnique();
            entity.Property(x => x.Comment).HasMaxLength(2000);
            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Reviews_Rating", "\"Rating\" BETWEEN 1 AND 5"));
            entity.HasOne(x => x.Booking).WithOne(x => x.Review)
                .HasForeignKey<Review>(x => x.BookingId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Product).WithMany(x => x.Reviews)
                .HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Reviewer).WithMany(x => x.Reviews)
                .HasForeignKey(x => x.ReviewerId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
