<?php
/**
 * Ludo Game Backend API
 * Handles room creation, multiplayer state synchronization, and leaderboard persistence.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataDir = __DIR__ . '/data';
$roomsDir = $dataDir . '/rooms';
$leaderboardFile = $dataDir . '/leaderboard.json';

// Ensure data directories exist
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0777, true);
}
if (!is_dir($roomsDir)) {
    @mkdir($roomsDir, 0777, true);
}
if (!file_exists($leaderboardFile)) {
    @file_put_contents($leaderboardFile, json_encode([]));
}

// Read input action and body
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$rawBody = file_get_contents('php://input');
$jsonBody = json_decode($rawBody, true) ?? [];

function sendResponse($success, $data = [], $message = '', $code = 200) {
    http_response_code($code);
    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message,
        'timestamp' => time()
    ], $data));
    exit;
}

function generateRoomCode($length = 4) {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code = '';
    for ($i = 0; $i < $length; $i++) {
        $code .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $code;
}

switch ($action) {
    case 'status':
        sendResponse(true, [
            'status' => 'online',
            'php_version' => PHP_VERSION,
            'storage_writable' => is_writable($dataDir)
        ], 'Ludo API is active');
        break;

    case 'create_room':
        $roomCode = generateRoomCode(4);
        $filePath = "$roomsDir/{$roomCode}.json";

        $hostName = trim($jsonBody['hostName'] ?? $_POST['hostName'] ?? 'Player 1');
        if (empty($hostName)) $hostName = 'Player 1';
        $hostColor = $jsonBody['hostColor'] ?? $_POST['hostColor'] ?? 'red';
        $playerCount = (int)($jsonBody['playerCount'] ?? $_POST['playerCount'] ?? 4);
        if ($playerCount < 2 || $playerCount > 4) $playerCount = 4;

        $colors = ['red', 'green', 'yellow', 'blue'];
        $players = [];

        foreach ($colors as $idx => $c) {
            if ($idx < $playerCount) {
                if ($c === $hostColor) {
                    $players[] = [
                        'color' => $c,
                        'name' => $hostName,
                        'type' => 'human',
                        'occupied' => true,
                        'clientId' => $jsonBody['clientId'] ?? uniqid('p_')
                    ];
                } else {
                    $players[] = [
                        'color' => $c,
                        'name' => ucfirst($c),
                        'type' => 'human',
                        'occupied' => false,
                        'clientId' => null
                    ];
                }
            } else {
                $players[] = [
                    'color' => $c,
                    'name' => ucfirst($c),
                    'type' => 'inactive',
                    'occupied' => false,
                    'clientId' => null
                ];
            }
        }

        $roomData = [
            'roomId' => $roomCode,
            'createdAt' => time(),
            'updatedAt' => time(),
            'playerCount' => $playerCount,
            'players' => $players,
            'gameState' => null,
            'version' => 1
        ];

        file_put_contents($filePath, json_encode($roomData, JSON_PRETTY_PRINT));
        sendResponse(true, ['room' => $roomData], "Room {$roomCode} created successfully");
        break;

    case 'join_room':
        $roomCode = strtoupper(trim($jsonBody['roomId'] ?? $_GET['roomId'] ?? ''));
        $filePath = "$roomsDir/{$roomCode}.json";

        if (!file_exists($filePath)) {
            sendResponse(false, [], "Room {$roomCode} not found", 404);
        }

        $roomData = json_decode(file_get_contents($filePath), true);
        $playerName = trim($jsonBody['playerName'] ?? 'Player');
        $preferredColor = $jsonBody['preferredColor'] ?? null;
        $clientId = $jsonBody['clientId'] ?? uniqid('p_');

        // Check if client is already in room
        $assignedSlot = null;
        foreach ($roomData['players'] as &$p) {
            if ($p['clientId'] === $clientId) {
                $assignedSlot = $p['color'];
                $p['name'] = $playerName;
                break;
            }
        }

        // If not in room, pick first available slot
        if (!$assignedSlot) {
            foreach ($roomData['players'] as &$p) {
                if ($p['type'] !== 'inactive' && empty($p['occupied'])) {
                    if (!$preferredColor || $p['color'] === $preferredColor) {
                        $p['occupied'] = true;
                        $p['name'] = $playerName;
                        $p['clientId'] = $clientId;
                        $assignedSlot = $p['color'];
                        break;
                    }
                }
            }

            // Fallback to any open active slot
            if (!$assignedSlot) {
                foreach ($roomData['players'] as &$p) {
                    if ($p['type'] !== 'inactive' && empty($p['occupied'])) {
                        $p['occupied'] = true;
                        $p['name'] = $playerName;
                        $p['clientId'] = $clientId;
                        $assignedSlot = $p['color'];
                        break;
                    }
                }
            }
        }

        if (!$assignedSlot) {
            sendResponse(false, [], "Room {$roomCode} is full", 400);
        }

        $roomData['updatedAt'] = time();
        $roomData['version'] = ($roomData['version'] ?? 0) + 1;
        file_put_contents($filePath, json_encode($roomData, JSON_PRETTY_PRINT));

        sendResponse(true, [
            'room' => $roomData,
            'assignedColor' => $assignedSlot
        ], "Joined room {$roomCode} as " . ucfirst($assignedSlot));
        break;

    case 'get_room':
        $roomCode = strtoupper(trim($jsonBody['roomId'] ?? $_GET['roomId'] ?? ''));
        $filePath = "$roomsDir/{$roomCode}.json";

        if (!file_exists($filePath)) {
            sendResponse(false, [], "Room {$roomCode} not found", 404);
        }

        $roomData = json_decode(file_get_contents($filePath), true);
        sendResponse(true, ['room' => $roomData]);
        break;

    case 'update_state':
        $roomCode = strtoupper(trim($jsonBody['roomId'] ?? ''));
        $filePath = "$roomsDir/{$roomCode}.json";

        if (!file_exists($filePath)) {
            sendResponse(false, [], "Room {$roomCode} not found", 404);
        }

        $roomData = json_decode(file_get_contents($filePath), true);
        $newGameState = $jsonBody['gameState'] ?? null;

        if ($newGameState) {
            $roomData['gameState'] = $newGameState;
            $roomData['updatedAt'] = time();
            $roomData['version'] = ($roomData['version'] ?? 0) + 1;
            file_put_contents($filePath, json_encode($roomData, JSON_PRETTY_PRINT));
        }

        sendResponse(true, ['version' => $roomData['version']], "Game state updated");
        break;

    case 'record_win':
        $winnerName = trim($jsonBody['winnerName'] ?? 'Anonymous');
        $winnerColor = trim($jsonBody['winnerColor'] ?? 'unknown');
        $turns = (int)($jsonBody['turns'] ?? 0);
        $captures = (int)($jsonBody['captures'] ?? 0);
        $duration = (int)($jsonBody['duration'] ?? 0);

        $leaderboard = [];
        if (file_exists($leaderboardFile)) {
            $leaderboard = json_decode(file_get_contents($leaderboardFile), true) ?: [];
        }

        $newEntry = [
            'id' => uniqid('win_'),
            'name' => $winnerName,
            'color' => $winnerColor,
            'turns' => $turns,
            'captures' => $captures,
            'duration' => $duration,
            'date' => date('Y-m-d H:i')
        ];

        array_unshift($leaderboard, $newEntry);
        // Keep top 30
        $leaderboard = array_slice($leaderboard, 0, 30);
        file_put_contents($leaderboardFile, json_encode($leaderboard, JSON_PRETTY_PRINT));

        sendResponse(true, ['entry' => $newEntry], "Win recorded");
        break;

    case 'get_leaderboard':
        $leaderboard = [];
        if (file_exists($leaderboardFile)) {
            $leaderboard = json_decode(file_get_contents($leaderboardFile), true) ?: [];
        }
        sendResponse(true, ['leaderboard' => $leaderboard]);
        break;

    default:
        sendResponse(false, [], 'Invalid action requested', 400);
        break;
}

