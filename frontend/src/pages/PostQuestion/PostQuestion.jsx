import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionService } from '../../services/questions/question.service.js';
import styles from './PostQuestion.module.css';
import ui from '../../styles/pageStates.module.css';
import { Sparkles, CheckCircle2, AlertCircle, Send } from 'lucide-react';

export default function PostQuestion() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!formData.title || formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters.';
    }
    if (!formData.content || formData.content.trim().length < 10) {
      errors.content = 'Content must be at least 10 characters.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear specific error on typing
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: null });
    }
    setError(null);
  };

  const handleCoachDraft = async () => {
    if (!validate()) return;
    setIsCoaching(true);
    setCoachFeedback(null);
    setError(null);
    try {
      const response = await questionService.generateQuestionDraftCoach(formData);
      setCoachFeedback(response.tips || response.feedback || []);
    } catch (err) {
      setError(err.message || 'Failed to get AI feedback. Please try again.');
    } finally {
      setIsCoaching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await questionService.createQuestion(formData);
      setSuccess('Question posted successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to post question. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Ask a public question</h1>
        <p className={styles.subtitle}>
          Get help from the community by providing clear details and context.
        </p>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.formContainer}>
          <div className={styles.card}>
            {success && <div className={styles.successMessage}>{success}</div>}
            {error && (
              <div className={`${ui.pageStates__message} ${ui['pageStates__message--error']}`} style={{ marginBottom: '1rem' }}>
                <AlertCircle size={24} />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="title" className={styles.label}>
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  placeholder="e.g. Is there an R function for finding the index of an element in a vector?"
                  className={styles.input}
                  value={formData.title}
                  onChange={handleChange}
                  disabled={isSubmitting || success !== null}
                />
                {validationErrors.title && (
                  <span className={styles.errorText}>{validationErrors.title}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="content" className={styles.label}>
                  What are the details of your problem?
                </label>
                <textarea
                  id="content"
                  name="content"
                  placeholder="Introduce the problem and expand on what you put in the title. Minimum 10 characters."
                  className={styles.textarea}
                  value={formData.content}
                  onChange={handleChange}
                  disabled={isSubmitting || success !== null}
                />
                {validationErrors.content && (
                  <span className={styles.errorText}>{validationErrors.content}</span>
                )}
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.btnCoach}
                  onClick={handleCoachDraft}
                  disabled={isCoaching || isSubmitting || success !== null}
                >
                  <Sparkles size={18} />
                  {isCoaching ? 'Analyzing...' : 'Get AI Feedback'}
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={isSubmitting || isCoaching || success !== null}
                >
                  <Send size={18} style={{ display: 'inline', marginRight: '8px' }} />
                  {isSubmitting ? 'Posting...' : 'Post Question'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className={styles.sidebar}>
          {coachFeedback ? (
            <div className={styles.coachPanel}>
              <div className={styles.coachHeader}>
                <Sparkles size={24} />
                <span>AI Draft Coach Feedback</span>
              </div>
              <div className={styles.coachTips}>
                {Array.isArray(coachFeedback) ? (
                  coachFeedback.map((tip, index) => (
                    <div key={index} className={styles.tipItem}>
                      {tip}
                    </div>
                  ))
                ) : (
                  <div className={styles.tipItem}>{coachFeedback}</div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>Step 1: Draft your question</h3>
              <ul className={styles.infoList}>
                <li className={styles.infoListItem}>
                  <CheckCircle2 className={styles.infoIcon} size={18} />
                  <span>Summarize your problem in a one-line title.</span>
                </li>
                <li className={styles.infoListItem}>
                  <CheckCircle2 className={styles.infoIcon} size={18} />
                  <span>Describe your problem in more detail.</span>
                </li>
                <li className={styles.infoListItem}>
                  <CheckCircle2 className={styles.infoIcon} size={18} />
                  <span>Describe what you tried and what you expected to happen.</span>
                </li>
                <li className={styles.infoListItem}>
                  <CheckCircle2 className={styles.infoIcon} size={18} />
                  <span>Review your question and post it to the site.</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
