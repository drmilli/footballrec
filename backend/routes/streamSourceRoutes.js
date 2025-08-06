const express = require('express');
const streamSourceService = require('../services/streamSourceService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Stream Sources
 *   description: API for managing streaming sources (SuperSport, YouTube Live Sport, FIFA+, CAF TV)
 */

/**
 * @swagger
 * /api/stream-sources:
 *   get:
 *     summary: Get all available stream sources
 *     tags: [Stream Sources]
 *     responses:
 *       200:
 *         description: List of all stream sources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [configured, not_configured]
 *                       hasApiKey:
 *                         type: boolean
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const sources = await streamSourceService.getAllSources();
    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    logger.error('Error fetching stream sources:', error.message);
    res.status(500).json({
      error: 'Failed to fetch stream sources',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/stream-sources/live:
 *   get:
 *     summary: Get all live streams from all sources
 *     tags: [Stream Sources]
 *     responses:
 *       200:
 *         description: List of all live streams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StreamSource'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/live', async (req, res) => {
  try {
    const streams = await streamSourceService.getAllLiveStreams();
    res.json({
      success: true,
      data: streams,
      count: streams.length
    });
  } catch (error) {
    logger.error('Error fetching live streams:', error.message);
    res.status(500).json({
      error: 'Failed to fetch live streams',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/stream-sources/{sourceId}/streams:
 *   get:
 *     summary: Get streams from a specific source
 *     tags: [Stream Sources]
 *     parameters:
 *       - in: path
 *         name: sourceId
 *         required: true
 *         schema:
 *           type: string
 *           enum: [supersport, youtube, fifa, caftv]
 *         description: The stream source ID
 *     responses:
 *       200:
 *         description: List of streams from the specified source
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StreamSource'
 *       400:
 *         description: Invalid source ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:sourceId/streams', async (req, res) => {
  try {
    const { sourceId } = req.params;
    let streams = [];

    switch (sourceId) {
      case 'supersport':
        streams = await streamSourceService.getSuperSportStreams();
        break;
      case 'youtube':
        streams = await streamSourceService.getYouTubeStreams();
        break;
      case 'fifa':
        streams = await streamSourceService.getFifaPlusStreams();
        break;
      case 'caftv':
        streams = await streamSourceService.getCafTvStreams();
        break;
      default:
        return res.status(400).json({
          error: 'Invalid source ID',
          message: `Unknown source: ${sourceId}`
        });
    }

    res.json({
      success: true,
      data: streams.map(stream => ({ ...stream, source: sourceId })),
      count: streams.length
    });
  } catch (error) {
    logger.error(`Error fetching streams from ${req.params.sourceId}:`, error.message);
    res.status(500).json({
      error: `Failed to fetch streams from ${req.params.sourceId}`,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/stream-sources/{sourceId}/streams/{streamId}:
 *   get:
 *     summary: Get a specific stream by ID from a source
 *     tags: [Stream Sources]
 *     parameters:
 *       - in: path
 *         name: sourceId
 *         required: true
 *         schema:
 *           type: string
 *           enum: [supersport, youtube, fifa, caftv]
 *         description: The stream source ID
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *         description: The stream ID
 *     responses:
 *       200:
 *         description: Stream details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StreamSource'
 *       404:
 *         description: Stream not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:sourceId/streams/:streamId', async (req, res) => {
  try {
    const { sourceId, streamId } = req.params;
    const stream = await streamSourceService.getStreamById(sourceId, streamId);
    
    res.json({
      success: true,
      data: stream
    });
  } catch (error) {
    logger.error(`Error fetching stream ${req.params.streamId} from ${req.params.sourceId}:`, error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Stream not found',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: `Failed to fetch stream from ${req.params.sourceId}`,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/stream-sources/{sourceId}/test:
 *   get:
 *     summary: Test connection to a specific stream source
 *     tags: [Stream Sources]
 *     parameters:
 *       - in: path
 *         name: sourceId
 *         required: true
 *         schema:
 *           type: string
 *           enum: [supersport, youtube, fifa, caftv]
 *         description: The stream source ID
 *     responses:
 *       200:
 *         description: Connection test result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [connected, not_configured, error]
 *                     message:
 *                       type: string
 *       400:
 *         description: Invalid source ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:sourceId/test', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const testResult = await streamSourceService.testSourceConnection(sourceId);
    
    res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    logger.error(`Error testing ${req.params.sourceId} connection:`, error.message);
    res.status(500).json({
      error: `Failed to test ${req.params.sourceId} connection`,
      message: error.message
    });
  }
});

module.exports = router;