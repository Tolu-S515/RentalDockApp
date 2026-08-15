using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using RentalDock.Api.Entities;
using RentalDock.Api.Services;


namespace RentalDock.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly JwtTokenService _jwtTokenService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        JwtTokenService jwtTokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "UserName, Email and Password are required." });
        }

        // Create user based on requested role (default to RenterUser)
        ApplicationUser user = request.UserType?.ToLower() switch
        {
            "owner" => new OwnerUser
            {
                UserName = request.UserName,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                CreatedAt = DateTime.UtcNow,
            },
            "admin" => new AdminUser
            {
                UserName = request.UserName,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                CreatedAt = DateTime.UtcNow,
            },
            _ => new RenterUser
            {
                UserName = request.UserName,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                CreatedAt = DateTime.UtcNow,
            }
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = "User registration failed.",
                errors = result.Errors.Select(error => error.Description)
            });
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            message = "User registered successfully.",
            userId = user.Id,
            role = user.GetRoleName()
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Identifier) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Identifier and Password are required." });
        }

        var user = await _userManager.FindByNameAsync(request.Identifier)
            ?? await _userManager.FindByEmailAsync(request.Identifier);

        if (user is null)
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);

        if (!result.Succeeded)
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }

        var token = _jwtTokenService.CreateToken(user);

        return Ok(new
        {
            message = "Login successful.",
            token,
            userId = user.Id,
            userName = user.UserName,
            email = user.Email,
            role = user.GetRoleName()
        });
    }
}

public class RegisterRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? UserType { get; set; } = "Renter"; // Default to Renter, can be "Owner" or "Admin"
}

public class LoginRequest
{
    public string Identifier { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
