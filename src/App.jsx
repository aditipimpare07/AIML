import { useEffect, useMemo, useState } from 'react'
import { budgetRanges, cuisines, locations, restaurants } from './data/restaurants.js'

const initialFilters = {
  cuisine: '',
  location: '',
  budget: '',
  ratingRange: '',
  dietary: '',
  sort: 'rating',
}

const initialPreferences = {
  cuisine: '',
  location: '',
  maxBudget: '',
  minRating: '',
  dietary: '',
  visits: '',
}

const ratingRanges = [
  { label: '1.0–1.9', min: 1, max: 1.9 },
  { label: '2.0–2.9', min: 2, max: 2.9 },
  { label: '3.0–3.4', min: 3, max: 3.4 },
  { label: '3.5–3.9', min: 3.5, max: 3.9 },
  { label: '4.0–4.4', min: 4, max: 4.4 },
  { label: '4.5–5.0', min: 4.5, max: 5 },
]

function loadFavorites() {
  const savedFavorites = localStorage.getItem('foodfinder-favorites')
  if (!savedFavorites) return []

  try {
    const parsedFavorites = JSON.parse(savedFavorites)
    return Array.isArray(parsedFavorites)
      ? parsedFavorites.filter((id) => restaurants.some((restaurant) => restaurant.id === id))
      : []
  } catch (error) {
    console.warn('FoodFinder could not read saved favorites.', error)
    return []
  }
}

function RestaurantImage({ restaurant, className = '' }) {
  return (
    <img
      className={className}
      src={restaurant.imageUrl}
      alt={`${restaurant.name} food`}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.onerror = null
        event.currentTarget.src = '/food-fallback.svg'
      }}
    />
  )
}

function Header({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const links = [
    ['Home', '#home'],
    ['Explore Restaurants', '#explore'],
    ['Recommendations', '#recommendations'],
    ['Favorites', '#favorites'],
    ['About', '#about'],
  ]

  function handleNavigation() {
    setMenuOpen(false)
    onNavigate?.()
  }

  return (
    <header className="site-header">
      <a className="brand" href="#home" onClick={handleNavigation} aria-label="FoodFinder home">
        <span className="brand-mark" aria-hidden="true">ff</span>
        <span>Food<span className="brand-accent">Finder</span></span>
      </a>
      <button
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
        {links.map(([label, href]) => (
          <a key={href} href={href} onClick={handleNavigation}>{label}</a>
        ))}
      </nav>
    </header>
  )
}

function SectionHeading({ eyebrow, title, description, align = 'left' }) {
  return (
    <div className={`section-heading align-${align}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  )
}

function EmptyState({ icon = '🍽️', title, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  )
}

function RestaurantCard({ restaurant, isFavorite, onToggleFavorite, onViewDetails, explanation }) {
  return (
    <article className="restaurant-card">
      <div className="card-image-wrap">
        <RestaurantImage restaurant={restaurant} className="card-image" />
        <span className="cuisine-pill">{restaurant.cuisine}</span>
        <button
          className={`favorite-button${isFavorite ? ' is-favorite' : ''}`}
          type="button"
          aria-label={isFavorite ? `Remove ${restaurant.name} from favorites` : `Add ${restaurant.name} to favorites`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(restaurant.id)}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>
      <div className="card-content">
        <div className="card-title-row">
          <div>
            <h3>{restaurant.name}</h3>
            <p className="card-location"><span aria-hidden="true">⌖</span> {restaurant.location}</p>
          </div>
          <span className="rating-chip"><span aria-hidden="true">★</span> {restaurant.rating.toFixed(1)}</span>
        </div>
        <div className="card-meta">
          <span>₹{restaurant.pricePerPerson.toLocaleString('en-IN')} <small>/ person</small></span>
          <span>{restaurant.reviewCount.toLocaleString('en-IN')} reviews</span>
        </div>
        {explanation && <p className="recommendation-reason">{explanation}</p>}
        <div className="card-footer">
          <span className="diet-label">{restaurant.foodType === 'Vegetarian' ? '🌿 Vegetarian' : restaurant.foodType === 'Non-vegetarian' ? '🍗 Non-veg' : '🌿 Veg & non-veg'}</span>
          <button className="text-button" type="button" onClick={() => onViewDetails(restaurant)}>
            View details <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  )
}

function RestaurantGrid({ items, favorites, onToggleFavorite, onViewDetails, explanations }) {
  return (
    <div className="restaurant-grid">
      {items.map((restaurant) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          isFavorite={favorites.includes(restaurant.id)}
          onToggleFavorite={onToggleFavorite}
          onViewDetails={onViewDetails}
          explanation={explanations?.[restaurant.id]}
        />
      ))}
    </div>
  )
}

function DetailsModal({ restaurant, isFavorite, onClose, onToggleFavorite }) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', closeOnEscape)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.classList.remove('modal-open')
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close restaurant details">×</button>
        <RestaurantImage restaurant={restaurant} className="modal-image" />
        <div className="modal-body">
          <p className="eyebrow">{restaurant.cuisine} · {restaurant.location}</p>
          <div className="modal-title-row">
            <h2 id="modal-title">{restaurant.name}</h2>
            <span className="rating-chip"><span aria-hidden="true">★</span> {restaurant.rating.toFixed(1)}</span>
          </div>
          <p className="modal-description">{restaurant.description}</p>
          <div className="details-facts">
            <div><span>Price per person</span><strong>₹{restaurant.pricePerPerson.toLocaleString('en-IN')}</strong></div>
            <div><span>Guest reviews</span><strong>{restaurant.reviewCount.toLocaleString('en-IN')}</strong></div>
            <div><span>Dining options</span><strong>{restaurant.foodType} · vegetarian options {restaurant.vegetarianOptions ? 'available' : 'not listed'}</strong></div>
            <div><span>Opening hours</span><strong>{restaurant.openingHours}</strong></div>
          </div>
          <h3 className="dishes-heading">Popular dishes</h3>
          <div className="dish-list">
            {restaurant.popularDishes.map((dish) => <span key={dish}>{dish}</span>)}
          </div>
          <button className={`button ${isFavorite ? 'button-outline' : 'button-primary'} modal-favorite`} type="button" onClick={() => onToggleFavorite(restaurant.id)}>
            <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
            {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          </button>
        </div>
      </section>
    </div>
  )
}

function App() {
  const [favorites, setFavorites] = useState(loadFavorites)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState(initialFilters)
  const [preferences, setPreferences] = useState(initialPreferences)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)

  useEffect(() => {
    localStorage.setItem('foodfinder-favorites', JSON.stringify(favorites))
  }, [favorites])

  const averageRating = (restaurants.reduce((total, restaurant) => total + restaurant.rating, 0) / restaurants.length).toFixed(1)

  const visibleRestaurants = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const matches = restaurants.filter((restaurant) => {
      const searchMatches = !query || [restaurant.name, restaurant.cuisine, restaurant.location]
        .some((value) => value.toLowerCase().includes(query))
      const dietaryMatches = !filters.dietary
        || (filters.dietary === 'vegetarian' && restaurant.vegetarianOptions)
        || (filters.dietary === 'non-vegetarian' && restaurant.foodType !== 'Vegetarian')
      const selectedBudget = budgetRanges.find((range) => range.label === filters.budget)
      const selectedRatingRange = ratingRanges.find((range) => range.label === filters.ratingRange)

      return searchMatches
        && (!filters.cuisine || restaurant.cuisine === filters.cuisine)
        && (!filters.location || restaurant.location === filters.location)
        && (!selectedBudget || (restaurant.pricePerPerson >= selectedBudget.min && restaurant.pricePerPerson <= selectedBudget.max))
        && (!selectedRatingRange || (restaurant.rating >= selectedRatingRange.min && restaurant.rating <= selectedRatingRange.max))
        && dietaryMatches
    })

    return matches.sort((a, b) => {
      if (filters.sort === 'price-low') return a.pricePerPerson - b.pricePerPerson
      if (filters.sort === 'price-high') return b.pricePerPerson - a.pricePerPerson
      return b.rating - a.rating || b.reviewCount - a.reviewCount
    })
  }, [searchTerm, filters])

  const recommendations = useMemo(() => {
    if (!showRecommendations) return null

    const activePreferences = [
      preferences.cuisine && ['cuisine', preferences.cuisine],
      preferences.location && ['location', preferences.location],
      Number(preferences.maxBudget) > 0 && ['budget', Number(preferences.maxBudget)],
      Number(preferences.minRating) > 0 && ['rating', Number(preferences.minRating)],
      preferences.dietary && ['dietary', preferences.dietary],
      preferences.visits && ['visits', preferences.visits],
    ].filter(Boolean)

    const matchesPreference = (restaurant, type, value) => {
      if (type === 'cuisine') return restaurant.cuisine === value
      if (type === 'location') return restaurant.location === value
      if (type === 'budget') return restaurant.pricePerPerson <= value
      if (type === 'rating') return restaurant.rating >= value
      if (type === 'dietary') {
        return value === 'vegetarian'
          ? restaurant.vegetarianOptions
          : restaurant.foodType !== 'Vegetarian'
      }
      if (type === 'visits') return restaurant.previouslyVisited === (value === 'visited')
      return false
    }
    const exactMatches = restaurants.filter((restaurant) => activePreferences.every(
      ([type, value]) => matchesPreference(restaurant, type, value),
    ))
    const scoreRestaurant = (restaurant) => activePreferences.reduce(
      (score, [type, value]) => score + (matchesPreference(restaurant, type, value) ? 1 : 0),
      0,
    )
    const rankedMatches = (exactMatches.length > 0 ? exactMatches : restaurants)
      .map((restaurant) => ({ restaurant, score: scoreRestaurant(restaurant) }))
      .sort((a, b) => b.score - a.score
        || b.restaurant.rating - a.restaurant.rating
        || a.restaurant.pricePerPerson - b.restaurant.pricePerPerson)
    const results = exactMatches.length > 0
      ? rankedMatches.map(({ restaurant }) => restaurant)
      : (rankedMatches.filter(({ score }) => score > 0).length > 0
        ? rankedMatches.filter(({ score }) => score > 0)
        : rankedMatches).slice(0, 3).map(({ restaurant }) => restaurant)
    const preferenceNames = {
      cuisine: 'cuisine',
      location: 'location',
      budget: 'budget',
      rating: 'minimum rating',
      dietary: 'food preference',
      visits: 'visit history',
    }
    const explanations = Object.fromEntries(results.map((restaurant) => {
      const matchedPreferences = activePreferences
        .filter(([type, value]) => matchesPreference(restaurant, type, value))
        .map(([type]) => preferenceNames[type])
      const missingPreferences = activePreferences
        .filter(([type, value]) => !matchesPreference(restaurant, type, value))
        .map(([type]) => preferenceNames[type])
      const explanation = exactMatches.length > 0
        ? `Recommended because it matches your selected ${matchedPreferences.join(', ')} preferences.`
        : `${matchedPreferences.length > 0 ? `Closest match: it fits your ${matchedPreferences.join(', ')} preferences.` : 'Closest available option: it does not meet a selected preference.'} Relax your ${missingPreferences.join(' or ')} to find more options.`
      return [restaurant.id, explanation]
    }))

    return {
      items: results,
      exact: exactMatches.length > 0,
      totalMatches: exactMatches.length,
      preferenceCount: activePreferences.length,
      explanations,
    }
  }, [preferences, showRecommendations])

  const favoriteRestaurants = useMemo(
    () => restaurants.filter((restaurant) => favorites.includes(restaurant.id)),
    [favorites],
  )

  function toggleFavorite(id) {
    setFavorites((current) => current.includes(id)
      ? current.filter((favoriteId) => favoriteId !== id)
      : [...current, id])
  }

  function scrollToExplore() {
    document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleSearch(event) {
    event.preventDefault()
    scrollToExplore()
  }

  function resetFilters() {
    setFilters(initialFilters)
    setSearchTerm('')
  }

  function updatePreference(event) {
    const { name, value } = event.target
    setPreferences((current) => ({ ...current, [name]: value }))
  }

  function clearPreferences() {
    setPreferences(initialPreferences)
    setShowRecommendations(false)
  }

  function getRecommendations(event) {
    event.preventDefault()
    setShowRecommendations(true)
  }

  return (
    <>
      <Header />
      <main>
        <section className="hero-section" id="home">
          <div className="hero-content">
            <span className="hero-kicker"><span aria-hidden="true">✦</span> GOOD FOOD, GREAT FINDS</span>
            <h1>Discover Your Next <span>Favourite</span> Restaurant</h1>
            <p>Find a table that fits your taste, your plans, and your budget. Your next great meal is just around the corner.</p>
            <form className="hero-search" onSubmit={handleSearch}>
              <label className="search-field">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Restaurant, cuisine, or area..."
                  aria-label="Search restaurants by name, cuisine, or location"
                />
              </label>
              <button className="button button-primary" type="submit">Find restaurants <span aria-hidden="true">→</span></button>
            </form>
            <div className="hero-note"><span aria-hidden="true">✓</span> A little local flavour for every kind of day</div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo-frame">
              <img
                src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=90"
                alt="Fresh colourful meal served at a restaurant"
                onError={(event) => {
                  event.currentTarget.onerror = null
                  event.currentTarget.src = '/food-fallback.svg'
                }}
              />
            </div>
            <div className="floating-note"><span className="floating-icon">★</span><span><strong>Made for your cravings</strong><small>Find your kind of delicious</small></span></div>
            <span className="hero-spark spark-one" aria-hidden="true">✳</span>
            <span className="hero-spark spark-two" aria-hidden="true">✦</span>
          </div>
        </section>

        <section className="stats-strip" aria-label="Restaurant directory summary">
          <div className="stat-card"><span className="stat-icon">🍴</span><div><strong>{restaurants.length}</strong><span>Sample restaurants</span></div></div>
          <div className="stat-card"><span className="stat-icon">◈</span><div><strong>{cuisines.length}</strong><span>Cuisines to explore</span></div></div>
          <div className="stat-card"><span className="stat-icon">★</span><div><strong>{averageRating}<small> / 5</small></strong><span>Average community rating</span></div></div>
        </section>

        <section className="content-section explore-section" id="explore">
          <div className="section-topline">
            <SectionHeading
              eyebrow="A table for every taste"
              title="Explore restaurants"
              description="Browse the sample restaurant list and discover somewhere new. Names, prices, ratings, and reviews are demonstration data."
            />
            <span className="results-count" aria-live="polite">{visibleRestaurants.length} matching {visibleRestaurants.length === 1 ? 'restaurant' : 'restaurants'}</span>
          </div>
          <div className="filter-panel">
            <label className="filter-control">
              <span>Cuisine</span>
              <select value={filters.cuisine} onChange={(event) => setFilters({ ...filters, cuisine: event.target.value })}>
                <option value="">All cuisines</option>
                {cuisines.map((cuisine) => <option key={cuisine} value={cuisine}>{cuisine}</option>)}
              </select>
            </label>
            <label className="filter-control">
              <span>Location</span>
              <select value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}>
                <option value="">All areas</option>
                {locations.map((location) => <option key={location} value={location}>{location}</option>)}
              </select>
            </label>
            <label className="filter-control">
              <span>Rating range</span>
              <select value={filters.ratingRange} onChange={(event) => setFilters({ ...filters, ratingRange: event.target.value })}>
                <option value="">Any rating</option>
                {ratingRanges.map((range) => <option key={range.label} value={range.label}>{range.label}</option>)}
              </select>
            </label>
            <label className="filter-control">
              <span>Budget range</span>
              <select value={filters.budget} onChange={(event) => setFilters({ ...filters, budget: event.target.value })}>
                <option value="">Any budget</option>
                {budgetRanges.map((range) => <option key={range.label} value={range.label}>{range.label}</option>)}
              </select>
            </label>
            <label className="filter-control">
              <span>Food preference</span>
              <select value={filters.dietary} onChange={(event) => setFilters({ ...filters, dietary: event.target.value })}>
                <option value="">Any options</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="non-vegetarian">Non-vegetarian</option>
              </select>
            </label>
            <label className="filter-control">
              <span>Sort by</span>
              <select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}>
                <option value="rating">Top rated</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </label>
            <button className="reset-button" type="button" onClick={resetFilters}>Reset filters</button>
          </div>
          {visibleRestaurants.length > 0 ? (
            <RestaurantGrid
              items={visibleRestaurants}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onViewDetails={setSelectedRestaurant}
            />
          ) : (
            <EmptyState title="No restaurants found">Try a different search or reset your filters to see all of our restaurants.</EmptyState>
          )}
        </section>

        <section className="recommendation-section" id="recommendations">
          <div className="recommendation-intro">
            <span className="recommendation-mark" aria-hidden="true">✦</span>
            <SectionHeading
              eyebrow="Your taste, your call"
              title="Let’s find your kind of place"
              description="Tell us what you’re in the mood for. We’ll match your preferences with our local restaurant list."
            />
            <div className="rule-based-note"><span aria-hidden="true">ⓘ</span> A simple, rule-based demo — no AI, just your preferences.</div>
          </div>
          <form className="preference-form" onSubmit={getRecommendations}>
            <div className="preference-form-heading">
              <div><span className="eyebrow">MAKE IT PERSONAL</span><h3>Your dining preferences</h3></div>
              <span className="preference-step">01 <span>/ 06</span></span>
            </div>
            <div className="preference-grid">
              <label className="filter-control">
                <span>Preferred cuisine</span>
                <select name="cuisine" value={preferences.cuisine} onChange={updatePreference}>
                  <option value="">Any cuisine</option>
                  {cuisines.map((cuisine) => <option key={cuisine} value={cuisine}>{cuisine}</option>)}
                </select>
              </label>
              <label className="filter-control">
                <span>Preferred location</span>
                <select name="location" value={preferences.location} onChange={updatePreference}>
                  <option value="">Any area</option>
                  {locations.map((location) => <option key={location} value={location}>{location}</option>)}
                </select>
              </label>
              <label className="filter-control">
                <span>Max. budget per person (₹)</span>
                <input name="maxBudget" type="number" min="0" step="50" placeholder="e.g. 700" value={preferences.maxBudget} onChange={updatePreference} />
              </label>
              <label className="filter-control">
                <span>Minimum rating</span>
                <select name="minRating" value={preferences.minRating} onChange={updatePreference}>
                  <option value="">Any rating</option>
                  <option value="1">1.0 and above</option>
                  <option value="2">2.0 and above</option>
                  <option value="3">3.0 and above</option>
                  <option value="3.5">3.5 and above</option>
                  <option value="4">4.0 and above</option>
                  <option value="4.5">4.5 and above</option>
                </select>
              </label>
              <label className="filter-control">
                <span>Food preference</span>
                <select name="dietary" value={preferences.dietary} onChange={updatePreference}>
                  <option value="">Any options</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="non-vegetarian">Non-vegetarian</option>
                </select>
              </label>
              <label className="filter-control">
                <span>Been there before?</span>
                <select name="visits" value={preferences.visits} onChange={updatePreference}>
                  <option value="">No preference</option>
                  <option value="new">Show me somewhere new</option>
                  <option value="visited">Places I’ve visited</option>
                </select>
              </label>
            </div>
            <div className="preference-actions">
              <button className="button button-primary" type="submit">Get recommendations <span aria-hidden="true">→</span></button>
              <button className="reset-button" type="button" onClick={clearPreferences}>Reset preferences</button>
            </div>
          </form>
          {recommendations && (
            <div className="recommendation-results" aria-live="polite">
              <div className="recommendation-results-heading">
                <div>
                  <p className="eyebrow">{recommendations.exact ? 'A match for your preferences' : 'A few close matches'}</p>
                  <h3>{recommendations.exact ? 'Here are your recommendations' : 'Try these closest matches'}</h3>
                </div>
                <span aria-live="polite">{recommendations.totalMatches} matching {recommendations.totalMatches === 1 ? 'restaurant' : 'restaurants'}</span>
              </div>
              {!recommendations.exact && (
                <p className="relax-message">No restaurant matched every preference. These closest matches fit some of your choices. Each result explains which preference to relax.</p>
              )}
              {recommendations.items.length > 0 ? (
                <RestaurantGrid
                  items={recommendations.items}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onViewDetails={setSelectedRestaurant}
                  explanations={recommendations.explanations}
                />
              ) : (
                <EmptyState title="Let’s try a broader search">We couldn’t find a close match. Clear a few preferences or explore all restaurants above.</EmptyState>
              )}
              {recommendations.exact && recommendations.preferenceCount === 0 && <p className="relax-message">Showing the full sample list, ranked by rating. Add preferences to make these recommendations more personal.</p>}
              {recommendations.exact && <p className="match-explanation">All {recommendations.totalMatches} matching restaurants are ranked by rating and value.</p>}
            </div>
          )}
        </section>

        <section className="content-section favorites-section" id="favorites">
          <div className="section-topline">
            <SectionHeading
              eyebrow="Keep the good ones close"
              title="Your favourites"
              description="The places you’ve saved for another delicious day."
            />
            {favoriteRestaurants.length > 0 && <span className="results-count">{favoriteRestaurants.length} saved</span>}
          </div>
          {favoriteRestaurants.length > 0 ? (
            <RestaurantGrid
              items={favoriteRestaurants}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onViewDetails={setSelectedRestaurant}
            />
          ) : (
            <EmptyState icon="♡" title="Your next favourite is out there">Tap the heart on any restaurant to save it here for later.</EmptyState>
          )}
        </section>

        <section className="about-section" id="about">
          <div className="about-copy">
            <p className="eyebrow">A LITTLE ABOUT FOODFINDER</p>
            <h2>Good recommendations start with <span>what you love.</span></h2>
            <p>FoodFinder is a college mini project that makes it easier to discover a restaurant for your next meal. Choose the cuisine, area, budget, rating, dietary options, and visit history that matter to you.</p>
            <p>The demo uses straightforward JavaScript filtering and ranking to compare your preferences against a hardcoded list of 50 sample restaurants. Restaurant names, ratings, reviews, prices, and details are demonstration data only—not verified real-world listings.</p>
            <p>No AI, machine learning, backend, or database is used. Your favourites are saved only in this browser using localStorage.</p>
          </div>
          <div className="about-card">
            <span className="about-card-icon" aria-hidden="true">⌖</span>
            <h3>Made for curious appetites</h3>
            <p>Browse, compare, save, and find somewhere new—all in one friendly little demo.</p>
            <a href="#explore">Start exploring <span aria-hidden="true">→</span></a>
            <div className="about-decor" aria-hidden="true">✳</div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <a className="brand footer-brand" href="#home"><span className="brand-mark" aria-hidden="true">ff</span><span>Food<span className="brand-accent">Finder</span></span></a>
        <p>A college mini project demo · Sample restaurant information</p>
        <a className="back-top" href="#home">Back to top ↑</a>
      </footer>

      {selectedRestaurant && (
        <DetailsModal
          restaurant={selectedRestaurant}
          isFavorite={favorites.includes(selectedRestaurant.id)}
          onClose={() => setSelectedRestaurant(null)}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </>
  )
}

export default App
