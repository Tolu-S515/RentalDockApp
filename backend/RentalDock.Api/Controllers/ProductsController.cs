using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalDock.Api.Data;
using RentalDock.Api.DTOs;
using RentalDock.Api.Entities;
using Microsoft.AspNetCore.Authorization;

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

        if (request.OwnerId == Guid.Empty)
        {
            return BadRequest(new { message = "Product owner is required." });
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

        if (!await _context.Users.AnyAsync(user => user.Id == request.OwnerId))
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
            OwnerId = request.OwnerId,
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
    public async Task<IActionResult> GetProducts()
    {
        var products = await _context.Products
            .AsNoTracking()
            .Where(product => product.IsActive)
            .OrderByDescending(product => product.CreatedAt)
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
