"use client";

import { useState } from "react";
import { useToast } from "./toast";

const MOCK_REVIEWS = [
  { id: 1, author: "Kevin W.", date: "2 hari lalu", rating: 5, text: "Kualitas sangat bagus. Respon dan pengiriman juga sangat cepat sampai ke Fakultas." },
  { id: 2, author: "Siti Rahma", date: "1 minggu lalu", rating: 4, text: "Beli untuk acara BEM, lumayan oke meskipun packing agak penyok dikit." },
  { id: 3, author: "Budi Santoso", date: "2 minggu lalu", rating: 5, text: "Mantapp, langganan banget deh kalau butuh cepat di kampus." }
];

export default function ReviewsPanel({ requiresAuth }) {
  const showToast = useToast();
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) {
      showToast("Tolong berikan rating bintang terlebih dahulu.");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setReviews([{
        id: Date.now(),
        author: "Anda",
        date: "Baru saja",
        rating,
        text: reviewText
      }, ...reviews]);
      
      setRating(0);
      setReviewText("");
      setIsSubmitting(false);
      showToast("Berhasil mengirimkan ulasan!");
    }, 600);
  }

  return (
    <section className="reviews-section">
      <div className="reviews-header">
        <div className="stack-xs">
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Ulasan Pelanggan</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Lihat apa kata mereka tentang produk ini.</p>
        </div>
        <strong style={{ fontSize: '1.8rem', color: 'var(--text)' }}>
          {(reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)} <span style={{ color: '#f59e0b', fontSize: '1.4rem' }}>★</span>
        </strong>
      </div>

      {!requiresAuth && (
        <form className="review-form-card" onSubmit={handleSubmit}>
          <h3 style={{ margin: '0 0 8px 0' }}>Tulis Ulasan Anda</h3>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Bagikan pengalaman Anda membeli produk ini.</p>
          
          <div className="star-input" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span 
                key={star} 
                className={`star ${(hoverRating || rating) >= star ? 'filled' : ''}`}
                onMouseEnter={() => setHoverRating(star)}
                onClick={() => setRating(star)}
                role="button"
                aria-label={`Rate ${star} stars`}
              >
                ★
              </span>
            ))}
          </div>

          <label className="field">
            <textarea 
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Ceritakan pengalaman Anda... (Opsi)"
              rows="3"
            />
          </label>

          <button 
            type="submit" 
            className="button button-primary" 
            disabled={isSubmitting}
            style={{ marginTop: '16px' }}
          >
            {isSubmitting ? "Mengirim..." : "Kirim Ulasan"}
          </button>
        </form>
      )}

      {requiresAuth && (
        <div className="card" style={{ padding: '24px', textAlign: 'center', marginBottom: '32px', background: 'var(--surface)' }}>
          <p style={{ margin: 0 }}>Silakan login untuk dapat menulis ulasan.</p>
        </div>
      )}

      <div className="stack-md">
        {reviews.map((review) => (
          <article key={review.id} className="review-card">
            <div className="review-author">
              <div className="author-avatar">{review.author.charAt(0)}</div>
              <div>
                <strong style={{ display: 'block' }}>{review.author}</strong>
                <small style={{ color: 'var(--muted)' }}>{review.date}</small>
              </div>
            </div>
            
            <div className="star-rating" style={{ marginBottom: '12px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`star ${star <= review.rating ? 'filled' : ''}`}>★</span>
              ))}
            </div>
            
            <p style={{ margin: 0, lineHeight: 1.5 }}>{review.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
