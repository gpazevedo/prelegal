const html2pdfMock = jest.fn(() => ({
  set: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  save: jest.fn().mockResolvedValue(undefined),
}));

export default html2pdfMock;
