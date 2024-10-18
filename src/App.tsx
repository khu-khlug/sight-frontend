import "./App.css";

function App() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div className="container">
      <h2>도어락 비밀번호 관리</h2>
      <form onSubmit={handleSubmit}>
        <div className="text-input-with-label">
          <label htmlFor="">마스터 비밀번호</label>
          <input id="master-password-input" type="text"></input>
        </div>
        <div className="text-input-with-label">
          <label htmlFor="">중앙동아리연합회용 비밀번호</label>
          <input id="master-password-input" type="text"></input>
        </div>
        <div className="text-input-with-label">
          <label htmlFor="">시설팀용 비밀번호</label>
          <input id="master-password-input" type="text"></input>
        </div>
        <div className="form-button">
          <button type="submit">저장</button>
        </div>
      </form>
    </div>
  );
}

export default App;
