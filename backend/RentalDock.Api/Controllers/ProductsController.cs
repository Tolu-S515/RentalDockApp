using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalDock.Api.Data;
using RentalDock.Api.DTOs;
using RentalDock.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace RentalDock.Api.Controllers;

[ApiController]
[Route("api/[controller]")]

public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] AddProductRequest request)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var ownerId))
        {
            return Unauthorized();
        }
        
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Product name is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new { message = "Product description is required." });
        }

        if (request.CategoryId == Guid.Empty)
        {
            return BadRequest(new { message = "Product category is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Location))
        {
            return BadRequest(new { message = "Product location is required." });
        }

        if (request.Price <= 0)
        {
            return BadRequest(new { message = "Product price is required." });
        }

        if (request.DepositAmount < 0)
        {
            return BadRequest(new { message = "Product deposit amount cannot be negative." });
        }

        if (!await _context.Users.AnyAsync(user => user.Id == ownerId && user.IsActive))
        {
            return BadRequest(new { message = "Product owner does not exist." });
        }

        if (!await _context.Categories.AnyAsync(category =>
                category.Id == request.CategoryId && category.IsActive))
        {
            return BadRequest(new { message = "Product category does not exist or is inactive." });
        }

        var product = new Product
        {   
            OwnerId = ownerId,
            Name = request.Name,
            Description = request.Description.Trim(),
            Price = request.Price,
            CategoryId = request.CategoryId,
            Condition = request.Condition,
            PricingPeriod = request.PricingPeriod,
            DepositAmount = request.DepositAmount,
            ImageUrl = request.ImageUrl,
            Location = request.Location,
            IsActive = true
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProduct(Guid id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product is null)
        {
            return NotFound(new { message = "Product not found." });
        }

        return Ok(product);
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? search,
        [FromQuery] Guid? categoryId,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] PricingPeriod? pricingPeriod,
        [FromQuery] string? sort = "recent")
    {
        if (minPrice < 0 || maxPrice < 0)
        {
            return BadRequest(new { message = "Prices cannot be negative." });
        }

        if (minPrice.HasValue && maxPrice.HasValue && minPrice > maxPrice)
        {
            return BadRequest(new { message = "Minimum price cannot exceed maximum price." });
        }

        var query = _context.Products
            .AsNoTracking()
            .Where(product => product.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(product =>
                product.Name.ToLower().Contains(term) ||
                product.Category.Name.ToLower().Contains(term) ||
                product.Owner.FirstName.ToLower().Contains(term) ||
                product.Owner.LastName.ToLower().Contains(term));
        }

        if (categoryId.HasValue)
            query = query.Where(product => product.CategoryId == categoryId.Value);

        if (minPrice.HasValue)
            query = query.Where(product => product.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(product => product.Price <= maxPrice.Value);

        if (pricingPeriod.HasValue)
            query = query.Where(product => product.PricingPeriod == pricingPeriod.Value);

        query = sort switch
        {
            "price-low" => query.OrderBy(product => product.Price),
            "price-high" => query.OrderByDescending(product => product.Price),
            _ => query.OrderByDescending(product => product.CreatedAt)
        };

        var products = await query
            .Select(product => new
            {
                product.Id,
                product.Name,
                CategoryName = product.Category.Name,
                OwnerName = product.Owner.FirstName + " " + product.Owner.LastName,
                product.Price,
                product.PricingPeriod,
                product.ImageUrl
            })
            .ToListAsync();

        return Ok(products);
    }
}
