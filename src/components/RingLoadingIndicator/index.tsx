import "./style.css";

export default function RingLoadingIndicator() {
  return (
    <div className="ring-loading-indicator">
      <div className="lds-dual-ring">
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
