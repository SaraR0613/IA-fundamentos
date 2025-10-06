// frontend/src/main.jsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [files, setFiles] = useState([]);
  const [subject, setSubject] = useState('Cálculo I');
  const [minSemester, setMinSemester] = useState(5);
  const [career, setCareer] = useState('Ingeniería de Sistemas');
  const [minGrade, setMinGrade] = useState(4.0);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('Por favor sube al menos un archivo .docx');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('subject', subject);
    formData.append('min_semester', minSemester);
    formData.append('career', career);
    formData.append('min_grade', minGrade);

    try {
      const res = await fetch('http://localhost:8000/process-cvs', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResults(data);
    } catch (error) {
      alert('Error al procesar los archivos. Asegúrate de que el backend esté corriendo.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>🎓 Selector de Monitores</h1>

      {results === null ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label><strong>📁 Subir hojas de vida (.docx):</strong></label>
            <input
              type="file"
              multiple
              accept=".docx"
              onChange={handleFileChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div>
            <label>Materia requerida:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: Cálculo I"
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div>
            <label>Semestre mínimo:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={minSemester}
              onChange={(e) => setMinSemester(Number(e.target.value))}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div>
            <label>Carrera requerida:</label>
            <input
              type="text"
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              placeholder="Ej: Ingeniería de Sistemas"
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div>
            <label>Nota mínima en la materia:</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={minGrade}
              onChange={(e) => setMinGrade(parseFloat(e.target.value))}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              backgroundColor: loading ? '#bdc3c7' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Procesando...' : '✅ Procesar hojas de vida'}
          </button>
        </form>
      ) : (
        <div>
          <h2 style={{ color: '#27ae60' }}>🏆 Candidatos seleccionados (ordenados por puntaje)</h2>
          {results.length === 0 ? (
            <p>No se encontraron candidatos que cumplan con todos los criterios.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#ecf0f1' }}>
                  <th style={{ border: '1px solid #bdc3c7', padding: '10px' }}>Nombre</th>
                  <th style={{ border: '1px solid #bdc3c7', padding: '10px' }}>Puntaje</th>
                  <th style={{ border: '1px solid #bdc3c7', padding: '10px' }}>Semestre</th>
                  <th style={{ border: '1px solid #bdc3c7', padding: '10px' }}>Nota en {subject}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((c, i) => (
                  <tr key={i} style={{ textAlign: 'center' }}>
                    <td style={{ border: '1px solid #bdc3c7', padding: '10px' }}>{c.name}</td>
                    <td style={{ border: '1px solid #bdc3c7', padding: '10px' }}><strong>{c.score}</strong></td>
                    <td style={{ border: '1px solid #bdc3c7', padding: '10px' }}>{c.semester}</td>
                    <td style={{ border: '1px solid #bdc3c7', padding: '10px' }}>{c.grade_in_subject}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button
            onClick={() => setResults(null)}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ← Volver a subir archivos
          </button>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);