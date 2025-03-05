# Quiz App Project Guidelines

## Project Structure
- `index.html`: Main HTML entry point
- `css/styles.css`: CSS styling
- `js/app.js`: App initialization
- `js/quiz.js`: Quiz logic implementation  
- `data/questions.json`: Quiz questions database

## Development Commands
- **Run locally**: Open `index.html` in a browser
- **Validate HTML**: `npx html-validate index.html`
- **Lint JS**: `npx eslint js/*.js`
- **Lint CSS**: `npx stylelint "css/*.css"`
- **Format code**: `npx prettier --write **/*.{js,html,css,json}`

## Code Style Guidelines
- Use ES6+ JavaScript features (classes, arrow functions, const/let)
- Follow camelCase for variable and function names
- Use descriptive variable/function names
- Handle errors with try/catch blocks (see quiz.js loadQuestions)
- Organize CSS with logical grouping of related properties
- Keep functions focused on single responsibility
- Use semantic HTML elements
- Use localStorage for state persistence
- Follow object-oriented design pattern for Quiz class