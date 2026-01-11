import { useState, useEffect } from 'react';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../api';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_students: 10,
    duration_minutes: 60
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await getCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCourse) {
        await updateCourse(selectedCourse.id, formData);
      } else {
        await createCourse(formData);
      }
      setShowModal(false);
      resetForm();
      loadCourses();
    } catch (error) {
      console.error('Failed to save course:', error);
      alert('수업 정보 저장에 실패했습니다.');
    }
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      description: course.description || '',
      max_students: course.max_students,
      duration_minutes: course.duration_minutes
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteCourse(id);
        loadCourses();
      } catch (error) {
        console.error('Failed to delete course:', error);
        alert('수업 삭제에 실패했습니다.');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', max_students: 10, duration_minutes: 60 });
    setSelectedCourse(null);
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>수업 관리</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          수업 추가
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>수업명</th>
              <th>설명</th>
              <th>최대 인원</th>
              <th>수업 시간</th>
              <th>등록일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.name}</td>
                <td>{course.description || '-'}</td>
                <td>{course.max_students}명</td>
                <td>{course.duration_minutes}분</td>
                <td>{new Date(course.created_at).toLocaleDateString('ko-KR')}</td>
                <td>
                  <button className="btn btn-primary" style={{ marginRight: '5px' }} onClick={() => handleEdit(course)}>
                    수정
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(course.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedCourse ? '수업 수정' : '수업 추가'}</h2>
              <button className="close-btn" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>수업명 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>최대 인원</label>
                <input
                  type="number"
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>수업 시간 (분)</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  min="30"
                  step="30"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">저장</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;
