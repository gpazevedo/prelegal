const mockPush = jest.fn();
const mockReplace = jest.fn();

export const useRouter = () => ({
  push: mockPush,
  replace: mockReplace,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
});

export const useSearchParams = () => new URLSearchParams();
export const usePathname = () => "/";
