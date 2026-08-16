using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalDock.Api.Data;
using RentalDock.Api.DTOs;
using RentalDock.Api.Entities;
using Microsoft.AspNetCore.Authorization;


namespace RentalDock.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CategoriesController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Category name is required." });
        }

        var category = new Category
        {
            Name = request.Name,
            Description = request.Description,
            IsActive = true
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCategory(Guid id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category is null)
        {
            return NotFound(new { message = "Category not found." });
        }

        return Ok(category);
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.Categories
            .AsNoTracking()
            .Where(category => category.IsActive)
            .OrderBy(category => category.Name)
            .Select(category => new
            {
                category.Id,
                category.Name,
                category.Description
            })
            .ToListAsync();

        return Ok(categories);
    }
}
