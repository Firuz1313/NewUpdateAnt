import React from "react";

console.log("🔥🔥🔥 RemoteBuilderTest: FILE LOADED! 🔥🔥🔥");

const RemoteBuilderTest = () => {
  console.log("🔥🔥🔥 RemoteBuilderTest: COMPONENT RENDERED! 🔥🔥🔥");

  React.useEffect(() => {
    console.log("🔥🔥🔥 RemoteBuilderTest: useEffect EXECUTED! 🔥🔥🔥");
  }, []);

  return (
    <div style={{ padding: "20px", backgroundColor: "red", color: "white" }}>
      <h1>🔥 RemoteBuilderTest Component 🔥</h1>
      <p>This is a test component to see if it renders correctly</p>
    </div>
  );
};

export default RemoteBuilderTest;
