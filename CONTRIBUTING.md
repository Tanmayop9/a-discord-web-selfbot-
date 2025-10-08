# Contributing to Discord Web Selfbot

Thank you for your interest in contributing! This guide will help you get started.

## 🤝 How to Contribute

### Reporting Bugs
If you find a bug, please create an issue with:
- A clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, Node.js version, etc.)

### Suggesting Features
We welcome feature suggestions! Please:
- Check if the feature already exists or is planned
- Provide a clear use case
- Explain why this feature would be useful
- Consider if it aligns with the project goals

### Code Contributions

1. **Fork the repository**
2. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Keep changes focused and minimal

4. **Test your changes**
   ```bash
   npm start
   ```
   - Verify the server starts correctly
   - Test all affected features
   - Check for console errors

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: description of your changes"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes

## 📋 Code Style Guidelines

### JavaScript
- Use modern ES6+ syntax
- Use `const` and `let`, avoid `var`
- Use async/await for asynchronous code
- Add JSDoc comments for functions
- Handle errors properly with try-catch

### EJS Templates
- Use semantic HTML
- Follow Discord's design patterns
- Keep templates DRY (Don't Repeat Yourself)
- Use partials for reusable components

### CSS
- Use CSS variables for colors and spacing
- Follow BEM naming convention
- Keep selectors specific but not overly complex
- Ensure responsive design

### File Structure
```
├── server.js           # Main server file
├── public/
│   ├── css/           # Stylesheets
│   ├── js/            # Client-side JavaScript
│   └── images/        # Static images
├── views/             # EJS templates
├── package.json       # Dependencies
└── README.md          # Documentation
```

## 🧪 Testing

Currently, this project doesn't have automated tests. When adding features:
- Test manually with a real Discord account
- Verify error handling
- Check edge cases
- Test on different screen sizes

## 🔐 Security Considerations

- Never commit Discord tokens
- Don't log sensitive information
- Validate all user inputs
- Use environment variables for secrets
- Follow Discord's rate limits

## 📝 Documentation

When adding features, please update:
- README.md with new features
- QUICKSTART.md if setup changes
- Code comments for complex logic
- API endpoint documentation

## ⚖️ Legal & Ethical Guidelines

Remember:
- This project is for educational purposes only
- Using selfbots violates Discord's ToS
- Don't encourage misuse of the tool
- Include appropriate warnings

## 🎯 Project Goals

This project aims to:
- Provide a comprehensive selfbot dashboard
- Demonstrate discord.js-selfbot-v13 capabilities
- Offer educational value for learning Discord API
- Maintain a clean, well-documented codebase

## 🚫 What We Don't Accept

- Features that could harm Discord or its users
- Code that violates Discord's ToS beyond selfbot usage
- Malicious features (spam, raid tools, etc.)
- Poorly documented or untested code
- Breaking changes without discussion

## 💬 Communication

- Use GitHub Issues for bug reports and features
- Keep discussions respectful and constructive
- Be patient with review times
- Ask questions if anything is unclear

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Your contributions help make this project better for everyone. We appreciate your time and effort!
