// Dynamic import wrapper for codestate-core package
const getCodestateCore = async () => {
  const codestate = await import("codestate-core");
  return codestate;
};

// Export the promise that resolves to the codestate-core module
export default getCodestateCore();

// Utility function to get the core module
export const getCore = async () => {
  return await getCodestateCore();
};
