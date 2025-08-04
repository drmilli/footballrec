const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { validateMatch, validateMatchId, validatePagination } = require('../middleware/validation');

// GET /api/matches - Get all matches with filtering
router.get('/', validatePagination, matchController.getMatches);

// GET /api/matches/upcoming - Get upcoming matches
router.get('/upcoming', matchController.getUpcomingMatches);

// GET /api/matches/today - Get today's matches
router.get('/today', matchController.getTodayMatches);

// GET /api/matches/:id - Get specific match by ID
router.get('/:id', validateMatchId, matchController.getMatchById);

// POST /api/matches - Create new match
router.post('/', validateMatch, matchController.createMatch);

// PUT /api/matches/:id - Update match
router.put('/:id', validateMatchId, validateMatch, matchController.updateMatch);

// DELETE /api/matches/:id - Delete match
router.delete('/:id', validateMatchId, matchController.deleteMatch);

// POST /api/matches/:id/auto-record - Enable/disable auto-recording for match
router.post('/:id/auto-record', validateMatchId, matchController.toggleAutoRecord);

// GET /api/matches/search/:query - Search matches
router.get('/search/:query', matchController.searchMatches);

// GET /api/matches/competition/:code - Get matches by competition
router.get('/competition/:code', matchController.getMatchesByCompetition);

// POST /api/matches/sync - Sync matches from external API
router.post('/sync', matchController.syncMatches);

module.exports = router;