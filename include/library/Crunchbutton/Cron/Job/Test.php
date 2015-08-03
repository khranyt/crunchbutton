<?php

class Crunchbutton_Cron_Job_Test extends Crunchbutton_Cron_Log {

	public function run(){

		$properties = ( array ) c::db()->dbo();
		foreach( $properties as $p ){
			if( $p->host ){
				$host = $p->host;
			}
		}

		//
		$crons = Crunchbutton_Cron_Log::q( 'SELECT * FROM cron_log WHERE `interval` > 0 AND current_status = ? ', [ Crunchbutton_Cron_Log::CURRENT_STATUS_RUNNING ] );
		foreach( $crons as $cron ){
			if( $cron->next_time ){
				$started_at = new DateTime( $cron->next_time, new DateTimeZone( c::config()->timezone ) );
				$started_at->modify( '- ' . $cron->interval_unity . ' ' . $cron->interval );
				$now = new DateTime( 'now', new DateTimeZone( c::config()->timezone ) );

				$interval = $now->diff( $started_at );
				$seconds = Crunchbutton_Util::intervalToSeconds( $interval );

				// if it started more than 10 min
				if( $seconds > ( 60 * 100 ) ){
					$cron->current_status = Crunchbutton_Cron_Log::CURRENT_STATUS_IDLE;
					$cron->save();
					$message = 'The cron task "' . $cron->description . '" have a problem updating the next_time and didn\'t run. ' . "<br>\n";
					foreach( $cron->properties() as $key => $val ){
						$message .= "<br>\n" . $key . ': ' . $val;
					}
					$message .= "<br>\n" .  'Running for: ' . $seconds . ' secs';
					$cron->warning( [ 'body' => $message ] );
				}
			}
		}

		Log::debug( [ 'desc' => 'testing the cron log', 'host' => $host, 'type' => 'cron-jobs' ] );

		// it always must call finished method at the end
		$this->finished();
	}
}