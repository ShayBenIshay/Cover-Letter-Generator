import { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import "./App.css";

function App() {
  const [formData, setFormData] = useState({
    company_name: "",
    job_description: "",
    cv_file: null,
  });
  const [coverLetter, setCoverLetter] = useState("");
  const [modificationNotes, setModificationNotes] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [version, setVersion] = useState(1);
  const [lastModified, setLastModified] = useState(null);
  const [savedCVs, setSavedCVs] = useState([]);
  const [selectedSavedCV, setSelectedSavedCV] = useState("");
  const coverLetterRef = useRef(null);

  useEffect(() => {
    const loadedCVs = JSON.parse(localStorage.getItem("savedCVs") || "[]");
    setSavedCVs(loadedCVs);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "cv_file" && files?.[0]) {
      const fileName = files[0].name;
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        if (window.confirm("Would you like to save this CV for future use?")) {
          const cvName = prompt("Enter a name for this CV:", fileName);
          if (cvName) {
            const newCV = {
              name: cvName,
              fileName: fileName,
              data: base64Data,
              dateAdded: new Date().toISOString(),
            };
            const updatedCVs = [...savedCVs, newCV];
            localStorage.setItem("savedCVs", JSON.stringify(updatedCVs));
            setSavedCVs(updatedCVs);
          }
        }
      };
      reader.readAsDataURL(files[0]);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSavedCVSelect = (e) => {
    const selectedCV = savedCVs.find((cv) => cv.name === e.target.value);
    if (selectedCV) {
      const dataStr = selectedCV.data;
      const arr = dataStr.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new File([u8arr], selectedCV.fileName, { type: mime });

      setFormData((prev) => ({
        ...prev,
        cv_file: file,
      }));
      setSelectedSavedCV(selectedCV.name);
    }
  };

  const deleteSavedCV = (cvName) => {
    if (window.confirm(`Are you sure you want to delete the CV: ${cvName}?`)) {
      const updatedCVs = savedCVs.filter((cv) => cv.name !== cvName);
      localStorage.setItem("savedCVs", JSON.stringify(updatedCVs));
      setSavedCVs(updatedCVs);
      if (selectedSavedCV === cvName) {
        setSelectedSavedCV("");
        setFormData((prev) => ({ ...prev, cv_file: null }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("cv_file", formData.cv_file);
      formDataToSend.append("company_name", formData.company_name);
      formDataToSend.append("job_description", formData.job_description);

      const response = await fetch(
        "http://localhost:8000/generate-cover-letter",
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate cover letter");
      }

      const data = await response.json();
      setCoverLetter(data.cover_letter);
      setModificationNotes("");
      setVersion(1);
      setLastModified(new Date().toISOString());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModify = async () => {
    if (!modificationNotes.trim()) {
      setError("Please enter modification notes");
      return;
    }

    setError("");
    setIsModifying(true);

    try {
      const response = await fetch(
        "http://localhost:8000/modify-cover-letter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            original_cover_letter: coverLetter,
            modification_notes: modificationNotes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to modify cover letter");
      }

      const data = await response.json();
      setCoverLetter(data.cover_letter);
      setModificationNotes("");
      setVersion((prev) => prev + 1);
      setLastModified(new Date().toISOString());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsModifying(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDownloadPDF = () => {
    const element = coverLetterRef.current;

    // Temporarily show the PDF content
    element.style.display = "block";

    const opt = {
      margin: [0.75, 0.75, 0.75, 0.75],
      filename: `Cover_Letter_${formData.company_name.replace(
        /\s+/g,
        "_"
      )}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
      },
      pagebreak: { mode: "avoid-all" },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        // Hide the PDF content again after generation
        element.style.display = "none";
      });
  };

  return (
    <div className="container">
      <h1>Cover Letter Generator</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="cv_file">Upload your CV (PDF)</label>
          <div className="cv-selection">
            {savedCVs.length > 0 && (
              <div className="saved-cvs">
                <label htmlFor="saved_cv">Or select a saved CV:</label>
                <select
                  id="saved_cv"
                  value={selectedSavedCV}
                  onChange={handleSavedCVSelect}
                >
                  <option value="">-- Select a saved CV --</option>
                  {savedCVs.map((cv) => (
                    <option key={cv.name} value={cv.name}>
                      {cv.name}
                    </option>
                  ))}
                </select>
                {selectedSavedCV && (
                  <button
                    type="button"
                    className="delete-cv-button"
                    onClick={() => deleteSavedCV(selectedSavedCV)}
                  >
                    Delete Selected CV
                  </button>
                )}
              </div>
            )}
            <input
              type="file"
              id="cv_file"
              name="cv_file"
              accept=".pdf"
              onChange={handleInputChange}
              required={!selectedSavedCV}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="company_name">Company Name</label>
          <input
            type="text"
            id="company_name"
            name="company_name"
            value={formData.company_name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="job_description">Job Description</label>
          <textarea
            id="job_description"
            name="job_description"
            value={formData.job_description}
            onChange={handleInputChange}
            rows="6"
            required
          />
        </div>

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Cover Letter"}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {coverLetter && (
        <div className="result">
          <div className="cover-letter-header">
            <h2>Generated Cover Letter</h2>
            <div className="version-info">
              <span>Version: {version}</span>
              {lastModified && (
                <span>Last modified: {formatDate(lastModified)}</span>
              )}
            </div>
          </div>

          <button
            className="submit-button download-button"
            onClick={handleDownloadPDF}
          >
            Download as PDF
          </button>

          <div className="cover-letter-pdf" ref={coverLetterRef}>
            <div className="pdf-header">
              <div className="sender-info">
                <p className="sender-name">Your Name</p>
                <p>your.email@example.com</p>
                <p>Your Phone Number</p>
              </div>
              <div className="date">
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="company-info">
                <p>{formData.company_name}</p>
              </div>
            </div>
            <div className="letter-content">
              <p>{coverLetter}</p>
            </div>
            <div className="letter-closing">
              <p>Sincerely,</p>
              <p className="sender-name">Your Name</p>
            </div>
          </div>

          <div className="preview-only">
            <p>{coverLetter}</p>
          </div>

          <div className="modification-section">
            <h3>Want to modify the cover letter?</h3>
            <div className="form-group">
              <label htmlFor="modification_notes">
                Enter your modification notes:
              </label>
              <textarea
                id="modification_notes"
                value={modificationNotes}
                onChange={(e) => setModificationNotes(e.target.value)}
                rows="4"
                placeholder="Example: Make it more formal, emphasize leadership skills, etc."
              />
            </div>
            <button
              className="submit-button modify-button"
              onClick={handleModify}
              disabled={isModifying || !modificationNotes.trim()}
            >
              {isModifying ? "Modifying..." : "Modify Cover Letter"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
