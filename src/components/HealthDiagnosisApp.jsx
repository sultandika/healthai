import React, { useState, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Heart,
  User,
  ChevronDown,
  AlertCircle,
  Calendar,
  Mail,
  Stethoscope,
  Activity
} from "lucide-react";

const HealthDiagnosisApp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [diagnosis, setDiagnosis] = useState(null);
  const [symptomDropdownOpen, setSymptomDropdownOpen] = useState(false);
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const resultsRef = useRef(null);

  const initializeAI = () => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "API key tidak dikonfigurasi. Pastikan environment variable REACT_APP_GEMINI_API_KEY telah diatur."
      );
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      return genAI.getGenerativeModel({ model: "gemini-pro" });
    } catch (error) {
      throw new Error(`Gagal menginisialisasi Gemini AI: ${error.message}`);
    }
  };

  const symptoms = [
    { id: "fever", name: "Demam" },
    { id: "headache", name: "Sakit Kepala" },
    { id: "cough", name: "Batuk" },
    { id: "sore_throat", name: "Sakit Tenggorokan" },
    { id: "fatigue", name: "Kelelahan" },
    { id: "body_ache", name: "Nyeri Otot" },
    { id: "nausea", name: "Mual" },
    { id: "dizziness", name: "Pusing" },
    { id: "diarrhea", name: "Diare" },
    { id: "stomach_pain", name: "Sakit Perut" },
    { id: "chest_pain", name: "Nyeri Dada" },
    { id: "breathing_difficulty", name: "Kesulitan Bernafas" },
    { id: "rash", name: "Ruam" },
    { id: "joint_pain", name: "Nyeri Sendi" },
    { id: "loss_appetite", name: "Kehilangan Nafsu Makan" },
    { id: "insomnia", name: "Susah Tidur" },
    { id: "anxiety", name: "Kecemasan" },
    { id: "depression", name: "Depresi" }
  ];

  const genders = [
    { id: "male", name: "Laki-laki" },
    { id: "female", name: "Perempuan" }
  ];

  const toggleSymptom = (symptomId) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((id) => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const safeParseJSON = (jsonString) => {
    try {
      const cleanedJson = jsonString
        .replace(/^[^{]*/, "")
        .replace(/[^}]*$/, "")
        .replace(/```json\s*/, "")
        .replace(/```\s*$/, "")
        .trim();

      const parsed = JSON.parse(cleanedJson);

      if (parsed && parsed.diagnosis) {
        return parsed;
      }

      throw new Error("Format JSON tidak valid");
    } catch (error) {
      console.error("Error Parsing JSON:", error);
      throw new Error(`Gagal mengurai diagnosis: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0 || !age || !gender) return;

    setLoading(true);
    setError(null);
    setDiagnosis(null);

    try {
      const model = initializeAI();
      const prompt = `
      PENTING: Jawab PERSIS dalam format JSON yang valid. 
      DILARANG menambahkan komentar atau teks di luar struktur JSON.

      Berikan diagnosis dan saran kesehatan berdasarkan gejala berikut:
      - Gejala: ${selectedSymptoms.map(id => symptoms.find(s => s.id === id)?.name).join(", ")}
      - Usia: ${age}
      - Jenis Kelamin: ${gender === 'male' ? 'Laki-laki' : 'Perempuan'}

      Format jawaban HARUS dalam JSON yang valid dengan struktur berikut:
      {
        "diagnosis": {
          "possibleConditions": [
            {
              "name": "Nama Penyakit",
              "probability": "Tinggi/Sedang/Rendah",
              "description": "Deskripsi singkat tentang penyakit"
            }
          ],
          "recommendations": {
            "immediate": ["Tindakan yang harus segera dilakukan"],
            "lifestyle": ["Saran perubahan gaya hidup"],
            "medications": ["Obat yang disarankan (dosis umum)"]
          },
          "urgencyLevel": "Normal/Segera/Darurat",
          "seekMedicalAttention": "Saran kapan harus ke dokter",
          "preventiveMeasures": ["Langkah pencegahan yang disarankan"]
        }
      }

      Pastikan:
      - Diagnosis sesuai dengan kombinasi gejala
      - Pertimbangkan faktor usia dan jenis kelamin
      - Berikan saran yang spesifik dan praktis
      - Sertakan peringatan jika gejala mengindikasikan kondisi serius`;

      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();
      
      const parsedDiagnosis = safeParseJSON(responseText);
      setDiagnosis(parsedDiagnosis.diagnosis);
    } catch (error) {
      console.error("Error menghasilkan diagnosis:", error);
      setError(`Terjadi kesalahan: ${error.message}`);
    }

    setLoading(false);
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case "Darurat": return "text-red-500";
      case "Segera": return "text-yellow-500";
      default: return "text-green-500";
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 fixed top-0 w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">HealthGuard AI</h1>
                <p className="text-sm text-gray-500">Asisten Diagnosa Pintar</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Analisis berbasis AI</span>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Penilaian Kesehatan Cerdas
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Jelaskan gejala Anda dan dapatkan wawasan kesehatan berbasis AI secara instan. 
              Ingat, alat ini hanya untuk tujuan informasi dan tidak menggantikan saran medis profesional.
            </p>
          </div>

          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white shadow-lg rounded-2xl border border-gray-200 max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gejala apa yang Anda alami?
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSymptomDropdownOpen(!symptomDropdownOpen)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <span className="text-gray-700">
                        {selectedSymptoms.length > 0
                          ? `${selectedSymptoms.length} gejala dipilih`
                          : "Pilih gejala"}
                      </span>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2" />
                    </button>

                    {symptomDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        <div className="p-3 grid grid-cols-2 gap-2">
                          {symptoms.map((symptom) => (
                            <label
                              key={symptom.id}
                              className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedSymptoms.includes(symptom.id)}
                                onChange={() => toggleSymptom(symptom.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                {symptom.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usia
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min="0"
                      max="120"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Masukkan usia Anda"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Kelamin
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setGenderDropdownOpen(!genderDropdownOpen)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <span className="text-gray-700">
                          {gender ? genders.find(g => g.id === gender)?.name : "Pilih jenis kelamin"}
                        </span>
                        <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2" />
                      </button>

                      {genderDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                          <div className="py-1">
                            {genders.map((g) => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                  setGender(g.id);
                                  setGenderDropdownOpen(false);
                                }}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                              >
                                {g.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={selectedSymptoms.length === 0 || !age || !gender || loading}
                  className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menganalisis...
                    </span>
                  ) : (
                    "Analisis Gejala"
                  )}
                </button>
              </div>
            </form>
          </div>
          {diagnosis && (
            <div ref={resultsRef} className="mt-12 max-w-4xl mx-auto">
              <div className="bg-white shadow-lg rounded-2xl border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Hasil Penilaian</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
                      ${diagnosis.urgencyLevel === 'Darurat' ? 'bg-red-100 text-red-800' :
                      diagnosis.urgencyLevel === 'Segera' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'}`}>
                      {diagnosis.urgencyLevel}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-6">
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Kemungkinan Kondisi</h4>
                    <div className="space-y-4">
                      {diagnosis.possibleConditions.map((condition, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium text-gray-900">{condition.name}</h5>
                            <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                              {condition.probability}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{condition.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="flex items-center text-blue-900 font-medium mb-3">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Tindakan Segera
                      </h4>
                      <ul className="space-y-2">
                        {diagnosis.recommendations.immediate.map((action, index) => (
                          <li key={index} className="text-sm text-blue-800">• {action}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="flex items-center text-purple-900 font-medium mb-3">
                        <Heart className="h-5 w-5 mr-2" />
                        Obat yang Disarankan
                      </h4>
                      <ul className="space-y-2">
                        {diagnosis.recommendations.medications.map((med, index) => (
                          <li key={index} className="text-sm text-purple-800">• {med}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="flex items-center text-green-900 font-medium mb-3">
                        <User className="h-5 w-5 mr-2" />
                        Rekomendasi Gaya Hidup
                      </h4>
                      <ul className="space-y-2">
                        {diagnosis.recommendations.lifestyle.map((item, index) => (
                          <li key={index} className="text-sm text-green-800">• {item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="flex items-center text-orange-900 font-medium mb-3">
                        <Calendar className="h-5 w-5 mr-2" />
                        Langkah Pencegahan
                      </h4>
                      <ul className="space-y-2">
                        {diagnosis.preventiveMeasures.map((measure, index) => (
                          <li key={index} className="text-sm text-orange-800">• {measure}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <h4 className="flex items-center text-blue-900 font-medium mb-2">
                      <Mail className="h-5 w-5 mr-2" />
                      Saran Medis Profesional
                    </h4>
                    <p className="text-sm text-blue-800">{diagnosis.seekMedicalAttention}</p>
                  </div>

                  <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500">
                      <strong>Pemberitahuan Penting:</strong> Penilaian ini hanya untuk tujuan informasi dan tidak menggantikan saran medis profesional, diagnosis, atau pengobatan. Selalu konsultasikan dengan dokter atau penyedia layanan kesehatan yang berkualifikasi untuk pertanyaan yang Anda miliki terkait kondisi medis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HealthDiagnosisApp;