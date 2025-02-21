import { BoxesLoader } from "react-awesome-loaders";

export const LoaderComponent = () => {
  console.log('Loader component rendered'); // Debug log
  
  return (
    <div className="fixed inset-0 flex items-center justify-center min-h-screen bg-neutral-900/85 z-50 animate-fadeIn">
      <div className="animate-scaleIn">
        <div className="animate-float">
          <BoxesLoader
            boxColor={"#6366F1"}
            style={{ marginBottom: "20px" }}
            desktopSize={"128px"}
            mobileSize={"64px"}
          />
        </div>
      </div>
    </div>
  );
}; 