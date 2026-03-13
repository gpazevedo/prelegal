import "@testing-library/jest-dom";

// jsdom does not implement scrollIntoView — mock globally for all tests
window.HTMLElement.prototype.scrollIntoView = jest.fn();
