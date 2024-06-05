namespace $ {
	export class $hyoo_crus_mine_fs extends $hyoo_crus_mine {
		
		@ $mol_mem
		static root() {
			return $mol_file.relative( '.crus' )
		}
		
		@ $mol_mem_key
		static rock_file( hash: Uint8Array ) {
			const id = $mol_base64_ae_encode( hash )
			return this.root().resolve( `rock/${ id.slice( 0, 2 ) }/${ id }.blob` )
		}
		
		@ $mol_mem_key
		static rock( hash: Uint8Array, next?: Uint8Array ) {
			$mol_wire_solid()
			const buf = this.rock_file( hash ).buffer( next )
			if( !next ) return buf
			if( $mol_compare_deep( hash, this.hash( buf ) ) ) return buf
			return null
		}
		
		@ $mol_mem_key
		static units_file( land: $hyoo_crus_land ) {
			const id = land.ref().description!
			const dir = this.root().resolve( `unit/${ id.slice( 0, 2 ) }` )
			dir.exists( true )
			return dir.resolve( `${ id }.crus` )
		}
		
		@ $mol_mem_key
		static units_offsets( land: $hyoo_crus_land ) {
			$mol_wire_solid() 
			return new Map< string, number >()
		}
		
		static units_sizes = new Map< $hyoo_crus_land, number >()
		
		static async units_save( land: $hyoo_crus_land, units: readonly $hyoo_crus_unit[] ) {
			
			const descr = this.units_file( land ).open( 'create', 'read_write' )
			try {
				
				const offsets = this.units_offsets( land )
				const append = [] as $hyoo_crus_unit[]
				
				for( const unit of units ) {
					const off = offsets.get( unit.key() )
					if( off === undefined ) {
						append.push( unit )
					} else {
						$node.fs.writeSync( descr, unit, 0, unit.byteLength, off )
					}
				}
				
				if( !append.length ) return
				
				let size = this.units_sizes.get( land ) ?? 0
				let offset = size
				size += append.length * $hyoo_crus_unit.size
				
				$node.fs.ftruncateSync( descr, size )
				this.units_sizes.set( land, size )
				
				for( const unit of append ) {
					$node.fs.writeSync( descr, unit, 0, unit.byteLength, offset )
					offsets.set( unit.key(), offset )
					offset += unit.byteLength
				}
			
			} finally {
				$node.fs.closeSync( descr )
			}
			
		}
		
		@ $mol_action
		static async units_load( land: $hyoo_crus_land ) {
			
			const descr = this.units_file( land ).open( 'create', 'read_write' )
			try {
			
				const buf = $node.fs.readFileSync( descr )
				if( !buf.length ) return []
				
				this.units_sizes.set( land, buf.length )
				const pack = $hyoo_crus_pack.from( buf )
				const { lands, rocks } = pack.parts( land.ref() )
				const units = lands[ land.ref() ]?.units ?? []
				
				const offsets = this.units_offsets( land )
				
				for( let i = 0; i < units.length; ++i ) {
					offsets.set( units[i].key(), i * $hyoo_crus_unit.size )
				}
				
				return units
				
			} finally {
				$node.fs.closeSync( descr )
			}
			
		}
		
	}
}
