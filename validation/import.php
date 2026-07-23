<?php
/**
 * Validation harness: build an Elementor page from the converter's output
 * JSON and report whether Elementor accepts/renders it.
 *
 * Run inside WP Playground via: wp eval-file /wordpress/val/import.php
 */

$json_path = '/wordpress/res/vorko.elementor.json';
$out_path  = '/wordpress/val/result.json';

$result = [ 'ok' => false, 'steps' => [] ];

$log = function ( $msg ) use ( &$result ) {
	$result['steps'][] = $msg;
	fwrite( STDOUT, "[validate] $msg\n" );
};

if ( ! file_exists( $json_path ) ) {
	$log( "MISSING input JSON: $json_path" );
	file_put_contents( $out_path, wp_json_encode( $result, JSON_PRETTY_PRINT ) );
	return;
}

$raw  = file_get_contents( $json_path );
$data = json_decode( $raw, true );
if ( ! is_array( $data ) || empty( $data['content'] ) ) {
	$log( 'INVALID JSON or empty content' );
	file_put_contents( $out_path, wp_json_encode( $result, JSON_PRETTY_PRINT ) );
	return;
}

$content = $data['content'];
$log( 'root elements: ' . count( $content ) );

// Count nodes/widgets for a sanity signal.
$counts = [ 'container' => 0, 'widget' => 0 ];
$widget_types = [];
$walk = function ( $nodes ) use ( &$walk, &$counts, &$widget_types ) {
	foreach ( $nodes as $n ) {
		if ( ! empty( $n['elType'] ) && isset( $counts[ $n['elType'] ] ) ) {
			$counts[ $n['elType'] ]++;
		}
		if ( ! empty( $n['widgetType'] ) ) {
			$widget_types[ $n['widgetType'] ] = ( $widget_types[ $n['widgetType'] ] ?? 0 ) + 1;
		}
		if ( ! empty( $n['elements'] ) ) {
			$walk( $n['elements'] );
		}
	}
};
$walk( $content );
$result['counts']       = $counts;
$result['widget_types'] = $widget_types;

// Create the page and attach the Elementor data.
$post_id = wp_insert_post( [
	'post_title'  => 'Vorko Validation',
	'post_status' => 'publish',
	'post_type'   => 'page',
	'post_name'   => 'vorko-validation',
] );

if ( is_wp_error( $post_id ) || ! $post_id ) {
	$log( 'wp_insert_post failed' );
	file_put_contents( $out_path, wp_json_encode( $result, JSON_PRETTY_PRINT ) );
	return;
}
$log( "post_id: $post_id" );
$result['post_id'] = $post_id;

update_post_meta( $post_id, '_elementor_edit_mode', 'builder' );
update_post_meta( $post_id, '_elementor_template_type', 'wp-page' );
update_post_meta( $post_id, '_elementor_version', $data['version'] ?? '3.0.0' );
// Elementor expects the meta value to be a (slashed) JSON string.
update_post_meta( $post_id, '_elementor_data', wp_slash( wp_json_encode( $content ) ) );

// Ask Elementor to regenerate CSS for this document, exercising the same
// code path the editor "save" uses to serialize/validate the data.
if ( class_exists( '\\Elementor\\Plugin' ) ) {
	try {
		$doc = \Elementor\Plugin::$instance->documents->get( $post_id );
		if ( $doc ) {
			$doc->save_type();
			$elements = $doc->get_elements_data();
			$result['elementor_parsed_elements'] = is_array( $elements ) ? count( $elements ) : 0;
			$log( 'Elementor parsed elements: ' . $result['elementor_parsed_elements'] );
		}
		\Elementor\Plugin::$instance->files_manager->clear_cache();
		$log( 'Elementor version: ' . ( defined( 'ELEMENTOR_VERSION' ) ? ELEMENTOR_VERSION : '?' ) );
	} catch ( \Throwable $e ) {
		$log( 'Elementor threw: ' . $e->getMessage() );
	}
} else {
	$log( 'Elementor Plugin class not found (plugin inactive?)' );
}

$result['url']         = get_permalink( $post_id );
$result['page_id_url'] = home_url( '/?page_id=' . $post_id );
$result['ok']          = true;
$log( 'permalink: ' . $result['url'] );

file_put_contents( $out_path, wp_json_encode( $result, JSON_PRETTY_PRINT ) );
